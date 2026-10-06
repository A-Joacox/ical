import type { FastifyInstance } from 'fastify'
import { analyzeFoodPhoto, QuotaError, type Gemini } from './foodPhoto.ts'

// Alimentos: Open Food Facts (productos envasados, en varios idiomas) y, si hay clave, USDA
// FoodData Central (alimentos genéricos, en inglés). Todos los valores son por 100 g.
// Y, si hay clave de Gemini, el análisis de fotos de platos.

export type FoodResult = {
  source: 'off' | 'usda'
  sourceId: string
  name: string
  brand?: string
  barcode?: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  /** Gramos de una porción, si el producto la indica. */
  servingGrams?: number
}

type Lang = 'es' | 'en'

// Open Food Facts pide identificar la app en el User-Agent.
const USER_AGENT = 'SelfGrow/0.1 (personal app; https://github.com/A-Joacox/ical)'
const TIMEOUT_MS = 8000
const OFF_FIELDS = 'code,product_name,product_name_es,product_name_en,brands,nutriments,serving_quantity'

type OffProduct = {
  code: string
  product_name?: string
  product_name_es?: string
  product_name_en?: string
  brands?: string | string[]
  nutriments?: Record<string, number | undefined>
  serving_quantity?: number | string
}

type UsdaFood = { fdcId: number; description: string; foodNutrients: { nutrientId: number; value?: number }[] }

const round = (value: number) => Math.round(value * 10) / 10

/** Producto de Open Food Facts → resultado. Sin nombre o sin calorías no sirve. */
export function fromOff(product: OffProduct, lang: Lang): FoodResult | undefined {
  const n = product.nutriments ?? {}
  // energy_100g viene en kJ.
  const kcal = n['energy-kcal_100g'] ?? (n.energy_100g === undefined ? undefined : n.energy_100g / 4.184)
  const name = (lang === 'en' ? product.product_name_en : product.product_name_es) || product.product_name
  if (!name?.trim() || kcal === undefined) return undefined
  const brand = (Array.isArray(product.brands) ? product.brands[0] : product.brands?.split(',')[0])?.trim()
  const serving = Number(product.serving_quantity)
  return {
    source: 'off',
    sourceId: product.code,
    barcode: product.code,
    name: name.trim(),
    brand: brand || undefined,
    kcal: round(kcal),
    protein: round(n.proteins_100g ?? 0),
    carbs: round(n.carbohydrates_100g ?? 0),
    fat: round(n.fat_100g ?? 0),
    servingGrams: serving > 0 ? serving : undefined,
  }
}

/** Alimento de USDA → resultado. La energía puede venir en distintos nutrientes según la base. */
export function fromUsda(food: UsdaFood): FoodResult | undefined {
  const value = (...ids: number[]) =>
    ids.map((id) => food.foodNutrients.find((n) => n.nutrientId === id)?.value).find((v) => v !== undefined)
  const kcal = value(1008, 2047, 2048)
  if (kcal === undefined) return undefined
  return {
    source: 'usda',
    sourceId: String(food.fdcId),
    name: food.description,
    kcal: round(kcal),
    protein: round(value(1003) ?? 0),
    carbs: round(value(1005) ?? 0),
    fat: round(value(1004) ?? 0),
  }
}

/** JSON de una API externa; null si responde 404. El error no incluye la URL (lleva la clave de USDA). */
async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`${new URL(url).host} respondió ${res.status}`)
  return (await res.json()) as T
}

async function searchOff(q: string, lang: Lang) {
  let products: OffProduct[]
  try {
    const params = new URLSearchParams({ search_terms: q, search_simple: '1', json: '1', page_size: '20', fields: OFF_FIELDS })
    products = (await getJson<{ products: OffProduct[] }>(`https://world.openfoodfacts.org/cgi/search.pl?${params}`))?.products ?? []
  } catch {
    // El buscador clásico a veces responde 503; el nuevo es más estable aunque menos preciso.
    const params = new URLSearchParams({ q, langs: lang, page_size: '20', fields: OFF_FIELDS })
    products = (await getJson<{ hits: OffProduct[] }>(`https://search.openfoodfacts.org/search?${params}`))?.hits ?? []
  }
  return products.flatMap((product) => fromOff(product, lang) ?? [])
}

async function searchUsda(q: string, apiKey: string) {
  const params = new URLSearchParams({ api_key: apiKey, query: q, dataType: 'Foundation,SR Legacy', pageSize: '15' })
  const data = await getJson<{ foods: UsdaFood[] }>(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`)
  return (data?.foods ?? []).flatMap((food) => fromUsda(food) ?? [])
}

const langOf = (lang: string | undefined): Lang => (lang === 'en' ? 'en' : 'es')

// Una foto de ~1024 px en JPEG pesa unos 200 KB; en base64, algo más.
const MAX_IMAGE_BYTES = 6 * 1024 * 1024

export function registerFoodRoutes(app: FastifyInstance, { usdaApiKey, gemini }: { usdaApiKey?: string; gemini?: Gemini }) {
  app.get<{ Querystring: { q?: string; lang?: string } }>('/api/food/search', async (req, reply) => {
    const q = req.query.q?.trim()
    if (!q) return reply.code(400).send({ error: 'missing_query' })
    const [off, usda] = await Promise.allSettled([
      searchOff(q, langOf(req.query.lang)),
      usdaApiKey ? searchUsda(q, usdaApiKey) : Promise.resolve([]),
    ])
    for (const result of [off, usda]) if (result.status === 'rejected') req.log.warn({ error: String(result.reason) }, 'food search failed')
    if (off.status === 'rejected' && usda.status === 'rejected') return reply.code(502).send({ error: 'food_api_unavailable' })
    return [...(off.status === 'fulfilled' ? off.value : []), ...(usda.status === 'fulfilled' ? usda.value : [])]
  })

  app.get<{ Params: { code: string }; Querystring: { lang?: string } }>('/api/food/barcode/:code', async (req, reply) => {
    const { code } = req.params
    if (!/^\d{6,14}$/.test(code)) return reply.code(400).send({ error: 'invalid_barcode' })
    let data: { product?: OffProduct } | null
    try {
      data = await getJson(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`)
    } catch (error) {
      req.log.warn({ error: String(error) }, 'barcode lookup failed')
      return reply.code(502).send({ error: 'food_api_unavailable' })
    }
    const food = data?.product && fromOff(data.product, langOf(req.query.lang))
    return food ?? reply.code(404).send({ error: 'not_found' })
  })

  app.post<{ Body: { image?: string; lang?: string } }>(
    '/api/food/analyze',
    { bodyLimit: MAX_IMAGE_BYTES + 1024, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      if (!gemini) return reply.code(503).send({ error: 'analyze_disabled' })
      const { image, lang } = req.body ?? {}
      if (typeof image !== 'string' || !image || image.length > MAX_IMAGE_BYTES) return reply.code(400).send({ error: 'invalid_image' })
      try {
        return await analyzeFoodPhoto(image, langOf(lang), gemini)
      } catch (error) {
        if (error instanceof QuotaError) return reply.code(429).send({ error: 'quota_exceeded' })
        req.log.warn({ error: String(error) }, 'food photo analysis failed')
        return reply.code(502).send({ error: 'analyze_failed' })
      }
    },
  )
}
