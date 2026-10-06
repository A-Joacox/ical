import { describe, expect, test } from 'vitest'
import { defaultAmount, searchSeedFoods } from './data'
import { SEED_FOODS } from './seedFoods'

describe('alimentos precargados', () => {
  test('ids únicos y medidas con gramos positivos', () => {
    expect(new Set(SEED_FOODS.map(([id]) => id)).size).toBe(SEED_FOODS.length)
    for (const [id, , , , , , , units] of SEED_FOODS) for (const [kind, grams] of units) expect(grams, `${id} ${kind}`).toBeGreaterThan(0)
  })

  // Si una columna quedara cruzada (proteína por grasa, etc.) las kcal dejarían de cuadrar con 4/4/9.
  // Excepciones reales de USDA: el alcohol aporta kcal propias y el cacao es casi 40 % fibra.
  test('las kcal cuadran con proteína, carbohidratos y grasa', () => {
    for (const [id, , , kcal, protein, carbs, fat] of SEED_FOODS) {
      if (kcal < 50 || ['cerveza', 'vino', 'cacao'].includes(id)) continue
      const atwater = 4 * protein + 4 * carbs + 9 * fat
      expect(Math.abs(atwater - kcal) / kcal, id).toBeLessThan(0.2)
    }
  })

  test('búsqueda sin tildes, por sinónimo y con los que empiezan así primero', () => {
    expect(searchSeedFoods('aguacate')[0].sourceId).toBe('palta')
    expect(searchSeedFoods('pina')[0].sourceId).toBe('pina')
    expect(searchSeedFoods('huevo')[0].sourceId).toBe('huevo')
    expect(searchSeedFoods('pollo').map((f) => f.sourceId)).toContain('arroz-con-pollo')
  })
})

describe('cantidad por defecto', () => {
  test('1 de la primera medida (la porción va primero) o 100 g', () => {
    const egg = searchSeedFoods('huevo de gallina')[0]
    expect(defaultAmount(egg)).toEqual({ grams: 44, unit: 'medium', quantity: 1 })
    expect(defaultAmount({ servingGrams: 30, units: [{ kind: 'cup', grams: 240 }] })).toEqual({ grams: 30, unit: 'serving', quantity: 1 })
    expect(defaultAmount({})).toEqual({ grams: 100 })
  })
})
