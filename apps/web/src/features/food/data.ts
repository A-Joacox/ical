import { db, newRow } from '../../db/db'
import { normalize } from '../../text'
import type { FoodResult } from './api'
import type { Food, FoodEntry, Meal, Nutrients } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const round1 = (value: number) => Math.round(value * 10) / 10

/** Nutrientes multiplicados por `factor` (gramos / 100 para pasar de "por 100 g" a una cantidad). */
export const scaleNutrients = (n: Nutrients, factor: number): Nutrients => ({
  kcal: round1(n.kcal * factor),
  protein: round1(n.protein * factor),
  carbs: round1(n.carbs * factor),
  fat: round1(n.fat * factor),
})

export const sumNutrients = (items: Nutrients[]): Nutrients =>
  items.reduce(
    (sum, n) => ({ kcal: sum.kcal + n.kcal, protein: sum.protein + n.protein, carbs: sum.carbs + n.carbs, fat: sum.fat + n.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )

/** Valores por 100 g de una entrada (se guarda con los nutrientes ya multiplicados). */
export const per100 = (entry: FoodEntry) => scaleNutrients(entry, 100 / entry.grams)

/** Día local como "AAAA-MM-DD". */
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function addDays(key: string, days: number) {
  const [y, m, d] = key.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + days))
}

// ---------- Alimentos ----------

/** Guarda un resultado de la búsqueda o del código de barras para tenerlo offline (una sola vez). */
export async function saveFoodResult(result: FoodResult): Promise<Food> {
  const id = `${result.source}:${result.sourceId}`
  const existing = await db.foods.get(id)
  if (existing && !existing.deletedAt) return existing
  const { name, brand, barcode, kcal, protein, carbs, fat, servingGrams, source } = result
  const food: Food = { ...newRow(), id, name, brand, barcode, kcal, protein, carbs, fat, servingGrams, source }
  await db.foods.put(food)
  return food
}

export type FoodValues = Pick<Food, 'name' | 'brand' | 'barcode' | 'servingGrams'> & Nutrients

export async function createFood(values: FoodValues): Promise<Food> {
  const food: Food = { ...newRow(), ...values, source: 'custom' }
  await db.foods.add(food)
  return food
}

export const findFoodByBarcode = (code: string) =>
  db.foods
    .where('barcode')
    .equals(code)
    .filter((f) => !f.deletedAt)
    .first()

/** Alimentos guardados en el iPhone cuyo nombre o marca contiene el texto. */
export async function searchLocalFoods(query: string) {
  const q = normalize(query.trim())
  return (await db.foods.toArray()).filter((f) => !f.deletedAt && normalize(`${f.name} ${f.brand ?? ''}`).includes(q))
}

/** Alimentos usados en los últimos 30 días, del más reciente al más antiguo. */
export async function getRecentFoods(limit = 25) {
  const since = dateKey(new Date(Date.now() - 30 * DAY_MS))
  const entries = (await db.foodEntries.where('date').aboveOrEqual(since).toArray())
    .filter((e) => !e.deletedAt && e.foodId)
    .sort((a, b) => b.createdAt - a.createdAt)
  const ids = [...new Set(entries.map((e) => e.foodId!))].slice(0, limit)
  return (await db.foods.bulkGet(ids)).filter((f): f is Food => !!f && !f.deletedAt)
}

// ---------- Registro del día ----------

export function addEntry(food: Food, grams: number, meal: Meal, date: string) {
  const entry: FoodEntry = { ...newRow(), date, meal, foodId: food.id, name: food.name, grams, ...scaleNutrients(food, grams / 100) }
  return db.foodEntries.add(entry)
}

/** Cambia los gramos o la comida; los nutrientes se recalculan en proporción. */
export function updateEntry(entry: FoodEntry, grams: number, meal: Meal) {
  return db.foodEntries.update(entry.id, { grams, meal, ...scaleNutrients(per100(entry), grams / 100), updatedAt: Date.now() })
}

export function deleteEntry(id: string) {
  const now = Date.now()
  return db.foodEntries.update(id, { deletedAt: now, updatedAt: now })
}
