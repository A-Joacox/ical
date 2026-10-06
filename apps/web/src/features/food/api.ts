import { api } from '../../api'

/** Alimento encontrado por el server (Open Food Facts o USDA). Valores por 100 g. */
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
  servingGrams?: number
}

export const searchFoods = (q: string, lang: string) => api<FoodResult[]>(`/food/search?${new URLSearchParams({ q, lang })}`)

/** Lanza ApiError 404 si el producto no está en Open Food Facts (o no tiene calorías). */
export const lookupBarcode = (code: string, lang: string) => api<FoodResult>(`/food/barcode/${code}?lang=${lang}`)
