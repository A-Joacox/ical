import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { buildApp } from './app.ts'
import { openDb } from './db.ts'
import { fromOff, fromUsda } from './food.ts'

const NUTELLA = {
  code: '3017620422003',
  product_name: 'Nutella',
  brands: 'Nutella, Ferrero',
  nutriments: { 'energy-kcal_100g': 539, proteins_100g: 6.3, carbohydrates_100g: 57.5, fat_100g: 30.9 },
  serving_quantity: '15',
}
const CHICKEN = {
  fdcId: 171477,
  description: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
  foodNutrients: [
    { nutrientId: 1003, value: 31 },
    { nutrientId: 1004, value: 3.57 },
    { nutrientId: 1005, value: 0 },
    { nutrientId: 1008, value: 165 },
  ],
}

describe('normalización', () => {
  test('Open Food Facts: nombre en el idioma, primera marca, porción y kJ → kcal', () => {
    expect(fromOff({ ...NUTELLA, product_name_es: 'Nutella crema' }, 'es')).toEqual({
      source: 'off',
      sourceId: NUTELLA.code,
      barcode: NUTELLA.code,
      name: 'Nutella crema',
      brand: 'Nutella',
      kcal: 539,
      protein: 6.3,
      carbs: 57.5,
      fat: 30.9,
      servingGrams: 15,
    })
    expect(fromOff({ code: '1', product_name: 'Agua', nutriments: { energy_100g: 418.4 } }, 'es')?.kcal).toBe(100)
    expect(fromOff({ code: '1', product_name: 'Sin datos', nutriments: {} }, 'es')).toBeUndefined()
  })

  test('USDA: usa la energía disponible (1008 o Atwater)', () => {
    expect(fromUsda(CHICKEN)).toMatchObject({ source: 'usda', sourceId: '171477', kcal: 165, protein: 31, fat: 3.6, carbs: 0 })
    const atwater = { ...CHICKEN, foodNutrients: [{ nutrientId: 2047, value: 120 }] }
    expect(fromUsda(atwater)?.kcal).toBe(120)
  })
})

describe('rutas', () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  let session: string
  let responses: Record<string, () => Response>

  beforeEach(async () => {
    responses = {}
    vi.stubGlobal('fetch', async (url: string) => {
      const match = Object.keys(responses).find((prefix) => url.startsWith(prefix))
      return match ? responses[match]() : new Response('not mocked', { status: 500 })
    })
    app = await buildApp({ db: openDb(':memory:'), sessionSecret: 's', auth: { rpID: 'localhost', origins: [] }, usdaApiKey: 'clave' })
    session = app.signCookie(String(Date.now() + 60_000))
  })

  afterEach(() => vi.unstubAllGlobals())

  const get = (url: string) => app.inject({ url, cookies: { sg_session: session } })
  const json = (body: unknown, status = 200) => () => Response.json(body, { status })

  test('busca en Open Food Facts y USDA', async () => {
    responses['https://world.openfoodfacts.org/cgi/search.pl'] = json({ products: [NUTELLA, { code: '2', product_name: 'Sin kcal' }] })
    responses['https://api.nal.usda.gov/'] = json({ foods: [CHICKEN] })
    const res = await get('/api/food/search?q=nutella')
    expect(res.json().map((f: { source: string; sourceId: string }) => `${f.source}:${f.sourceId}`)).toEqual(['off:3017620422003', 'usda:171477'])
  })

  test('si el buscador clásico falla usa el nuevo; si todo falla responde 502', async () => {
    responses['https://world.openfoodfacts.org/cgi/search.pl'] = json({}, 503)
    responses['https://search.openfoodfacts.org/'] = json({ hits: [NUTELLA] })
    responses['https://api.nal.usda.gov/'] = json({}, 500)
    expect((await get('/api/food/search?q=nutella')).json()).toHaveLength(1)

    responses['https://search.openfoodfacts.org/'] = json({}, 500)
    expect((await get('/api/food/search?q=nutella')).statusCode).toBe(502)
  })

  test('código de barras: encontrado, no encontrado e inválido', async () => {
    responses['https://world.openfoodfacts.org/api/v2/product/3017620422003'] = json({ product: NUTELLA })
    responses['https://world.openfoodfacts.org/api/v2/product/7750000000000'] = json({ status: 0 }, 404)
    expect((await get('/api/food/barcode/3017620422003')).json()).toMatchObject({ name: 'Nutella', kcal: 539 })
    expect((await get('/api/food/barcode/7750000000000')).statusCode).toBe(404)
    expect((await get('/api/food/barcode/abc')).statusCode).toBe(400)
  })
})
