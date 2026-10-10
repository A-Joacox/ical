import { describe, expect, test } from 'vitest'
import { addDays, dateKey, startOfWeek } from '../../dates'
import { per100, recipeValues, scaleNutrients, sumNutrients } from './data'
import type { FoodEntry } from './types'

describe('nutrientes', () => {
  const nutella = { kcal: 539, protein: 6.3, carbs: 57.5, fat: 30.9 }

  test('de 100 g a una porción y de vuelta', () => {
    const portion = scaleNutrients(nutella, 15 / 100)
    expect(portion).toEqual({ kcal: 80.9, protein: 0.9, carbs: 8.6, fat: 4.6 })
    const entry = { ...nutella, ...scaleNutrients(nutella, 2), grams: 200 } as FoodEntry
    expect(per100(entry)).toEqual(nutella)
  })

  test('suma del día', () => {
    expect(sumNutrients([nutella, nutella])).toEqual({ kcal: 1078, protein: 12.6, carbs: 115, fat: 61.8 })
    expect(sumNutrients([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe('platos', () => {
  // Arroz y frijoles en crudo, pollo al horno; valores por 100 g.
  const items = [
    { food: { kcal: 360, protein: 7, carbs: 79, fat: 0.6 }, grams: 200 },
    { food: { kcal: 341, protein: 21, carbs: 62, fat: 1.2 }, grams: 150 },
    { food: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 }, grams: 180 },
  ]

  test('sin peso cocinado: por 100 g de lo crudo y una porción es el plato entero', () => {
    expect(recipeValues(items)).toEqual({ kcal: 288.4, protein: 19.1, carbs: 47.4, fat: 1.8, servingGrams: 530 })
  })

  test('con peso cocinado: por 100 g de lo cocinado (la olla de 1200 g tiene las mismas 1528 kcal)', () => {
    expect(recipeValues(items, 1200)).toEqual({ kcal: 127.4, protein: 8.4, carbs: 20.9, fat: 0.8, servingGrams: undefined })
  })
})

describe('fechas', () => {
  test('día local y cambio de mes', () => {
    expect(dateKey(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05')
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    // Semana de lunes a domingo.
    expect(startOfWeek('2026-10-07')).toBe('2026-10-05')
    expect(startOfWeek('2026-10-11')).toBe('2026-10-05')
    expect(startOfWeek('2026-10-05')).toBe('2026-10-05')
  })
})
