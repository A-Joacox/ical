import { describe, expect, test } from 'vitest'
import { addDays, dateKey, per100, scaleNutrients, sumNutrients } from './data'
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

describe('fechas', () => {
  test('día local y cambio de mes', () => {
    expect(dateKey(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05')
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})
