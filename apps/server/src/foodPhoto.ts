// Análisis de la foto de un plato con Gemini: qué hay, cuánto pesa cada cosa y sus nutrientes.
// La foto solo pasa por aquí hacia Google; no se guarda.

export type Gemini = { apiKey: string; model: string }
export type Confidence = 'high' | 'medium' | 'low'
export type PhotoItem = { name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number; confidence: Confidence }

/** Gemini respondió 429: se acabó la cuota gratuita por ahora. */
export class QuotaError extends Error {}

const TIMEOUT_MS = 60_000
const MAX_ITEMS = 15
const CONFIDENCES = ['high', 'medium', 'low'] as const

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          grams: { type: 'number', description: 'Weight of the portion served, in grams' },
          kcal: { type: 'number', description: 'Kilocalories of that portion' },
          protein: { type: 'number', description: 'Grams of protein of that portion' },
          carbs: { type: 'number', description: 'Grams of carbohydrates of that portion' },
          fat: { type: 'number', description: 'Grams of fat of that portion' },
          confidence: { type: 'string', enum: CONFIDENCES },
        },
        required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat', 'confidence'],
      },
    },
  },
  required: ['items'],
}

const prompt = (lang: 'es' | 'en') =>
  [
    'You are a nutrition assistant. Identify each food or drink in this photo, listing the components of a plate separately',
    '(for example rice, beans and chicken). For each one estimate the portion actually served in grams, and the kcal, protein,',
    'carbohydrates and fat of that portion, using typical values for home cooking. Set confidence to how sure you are of both',
    'the food and the amount.',
    lang === 'es'
      ? 'Write the names in Spanish as used in Peru (for example "arroz blanco", "lomo saltado", "palta").'
      : 'Write the names in English.',
    'If there is no food in the photo, return an empty list.',
  ].join(' ')

const round1 = (value: number) => Math.round(value * 10) / 10
const isAmount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0

/** Se queda con lo que tiene sentido de la respuesta del modelo. */
export function normalizeItems(raw: unknown): PhotoItem[] {
  const items = (raw as { items?: unknown })?.items
  if (!Array.isArray(items)) return []
  return items
    .filter(
      (i): i is PhotoItem =>
        typeof i?.name === 'string' && !!i.name.trim() && i.grams > 0 && [i.grams, i.kcal, i.protein, i.carbs, i.fat].every(isAmount),
    )
    .slice(0, MAX_ITEMS)
    .map((i) => ({
      name: i.name.trim(),
      grams: Math.round(i.grams),
      kcal: round1(i.kcal),
      protein: round1(i.protein),
      carbs: round1(i.carbs),
      fat: round1(i.fat),
      confidence: CONFIDENCES.includes(i.confidence) ? i.confidence : 'low',
    }))
}

/** `image` es un JPEG en base64 (sin el prefijo data:). */
export async function analyzeFoodPhoto(image: string, lang: 'es' | 'en', { apiKey, model }: Gemini): Promise<PhotoItem[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt(lang) }, { inlineData: { mimeType: 'image/jpeg', data: image } }] }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: SCHEMA },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (res.status === 429) throw new QuotaError('gemini quota exceeded')
  if (!res.ok) throw new Error(`gemini respondió ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('')
  return normalizeItems(JSON.parse(text))
}
