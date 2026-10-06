import { api } from '../../api'
import type { FoodUnit } from './types'

/**
 * Alimento que aún no está guardado en el iPhone: del server (Open Food Facts o USDA) o de la lista
 * precargada. Valores por 100 g. Se guarda al usarlo.
 */
export type FoodResult = {
  source: 'off' | 'usda' | 'seed'
  sourceId: string
  name: string
  nameEn?: string
  units?: FoodUnit[]
  brand?: string
  barcode?: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  servingGrams?: number
}

export const searchFoods = (q: string, lang: string) => api<FoodResult[]>(`/food/search?${new URLSearchParams({ q, lang })}`)

/** Lanza ApiError 404 si el producto no está en Open Food Facts (o no tiene calorías). */
export const lookupBarcode = (code: string, lang: string) => api<FoodResult>(`/food/barcode/${code}?lang=${lang}`)
