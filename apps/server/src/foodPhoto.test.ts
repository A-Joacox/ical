import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { buildApp } from './app.ts'
import { openDb } from './db.ts'
import { normalizeItems } from './foodPhoto.ts'

const RICE = { name: 'Arroz blanco', grams: 180.4, kcal: 234.04, protein: 4.8, carbs: 50.7, fat: 0.5, confidence: 'high' }

describe('normalización de la respuesta', () => {
  test('redondea y descarta lo que no tiene sentido', () => {
    const items = normalizeItems({
      items: [RICE, { ...RICE, name: ' ' }, { ...RICE, grams: 0 }, { ...RICE, kcal: -5 }, { ...RICE, name: 'Palta', confidence: 'mucha' }],
    })
    expect(items).toEqual([
      { ...RICE, grams: 180, kcal: 234 },
      { ...RICE, name: 'Palta', grams: 180, kcal: 234, confidence: 'low' },
    ])
    expect(normalizeItems({ nada: true })).toEqual([])
  })
})

describe('POST /api/food/analyze', () => {
  let calls: { url: string; init: RequestInit }[]
  let answer: () => Response

  const gemini = (items: object[]) => () =>
    Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ items }) }] } }] })

  beforeEach(() => {
    calls = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => (calls.push({ url, init }), answer()))
  })
  afterEach(() => vi.unstubAllGlobals())

  async function setup(withKey = true) {
    const app = await buildApp({
      db: openDb(':memory:'),
      sessionSecret: 's',
      auth: { rpID: 'localhost', origins: [] },
      gemini: withKey ? { apiKey: 'clave-secreta', model: 'gemini-flash-latest' } : undefined,
    })
    const session = app.signCookie(String(Date.now() + 60_000))
    return (payload: object) => app.inject({ method: 'POST', url: '/api/food/analyze', payload, cookies: { sg_session: session } })
  }

  test('envía la foto a Gemini (clave en cabecera, no en la URL) y devuelve los alimentos', async () => {
    answer = gemini([RICE])
    const res = await (await setup())({ image: 'aGVsbG8=', lang: 'es' })
    expect(res.json()).toEqual([{ ...RICE, grams: 180, kcal: 234 }])

    const [{ url, init }] = calls
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent')
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('clave-secreta')
    const body = JSON.parse(init.body as string)
    expect(body.contents[0].parts[1].inlineData).toEqual({ mimeType: 'image/jpeg', data: 'aGVsbG8=' })
    expect(body.contents[0].parts[0].text).toContain('Peru')
  })

  test('cuota agotada → 429; otro error → 502; sin clave → 503; sin imagen → 400', async () => {
    const post = await setup()
    answer = () => new Response('quota', { status: 429 })
    expect((await post({ image: 'aGVsbG8=' })).statusCode).toBe(429)
    answer = () => new Response('boom', { status: 500 })
    expect((await post({ image: 'aGVsbG8=' })).statusCode).toBe(502)
    expect((await post({})).statusCode).toBe(400)
    expect((await (await setup(false))({ image: 'aGVsbG8=' })).statusCode).toBe(503)
  })
})
