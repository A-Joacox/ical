import type { Row } from '../gym/types'

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type Meal = (typeof MEALS)[number]

export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number }

/** Medidas caseras. Cada alimento dice cuántos gramos pesa una de cada una. */
export const UNIT_KINDS = ['unit', 'small', 'medium', 'large', 'slice', 'cup', 'glass', 'tbsp', 'tsp', 'can', 'fillet', 'clove', 'serving'] as const
export type UnitKind = (typeof UNIT_KINDS)[number]
export type FoodUnit = { kind: UnitKind; grams: number }

/**
 * Alimento con valores por 100 g. Los que vienen de la búsqueda o del código de barras usan un id
 * fijo ("off:<código>", "usda:<id>") para no guardarse dos veces.
 */
export type Food = Row &
  Nutrients & {
    name: string
    /** Solo los alimentos precargados traen nombre en inglés. */
    nameEn?: string
    brand?: string
    barcode?: string
    /** Gramos de una porción, si se conoce. */
    servingGrams?: number
    /** Otras medidas: taza, cucharada, unidad mediana… */
    units?: FoodUnit[]
    source: 'off' | 'usda' | 'seed' | 'custom' | 'recipe'
    /** Solo platos: ingredientes con sus gramos. Los valores por 100 g se calculan al guardar. */
    ingredients?: Ingredient[]
    /** Solo platos: peso final cocinado; si no está, se usa la suma de los ingredientes. */
    cookedGrams?: number
  }

export type Ingredient = { foodId: string; grams: number }

/** Lo que se comió: nombre y nutrientes ya calculados para los gramos (no cambian si cambia el alimento). */
export type FoodEntry = Row &
  Nutrients & {
    /** Día local, "AAAA-MM-DD". */
    date: string
    meal: Meal
    foodId?: string
    name: string
    grams: number
    /** Si se registró en una medida casera (2 unidades medianas), para mostrarla igual. */
    unit?: UnitKind
    quantity?: number
  }
