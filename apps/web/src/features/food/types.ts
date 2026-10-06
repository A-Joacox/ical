import type { Row } from '../gym/types'

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type Meal = (typeof MEALS)[number]

export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number }

/**
 * Alimento con valores por 100 g. Los que vienen de la búsqueda o del código de barras usan un id
 * fijo ("off:<código>", "usda:<id>") para no guardarse dos veces.
 */
export type Food = Row &
  Nutrients & {
    name: string
    brand?: string
    barcode?: string
    /** Gramos de una porción, si se conoce. */
    servingGrams?: number
    source: 'off' | 'usda' | 'custom'
  }

/** Lo que se comió: nombre y nutrientes ya calculados para los gramos (no cambian si cambia el alimento). */
export type FoodEntry = Row &
  Nutrients & {
    /** Día local, "AAAA-MM-DD". */
    date: string
    meal: Meal
    foodId?: string
    name: string
    grams: number
  }
