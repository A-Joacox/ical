import { dateKey } from '../../dates'
import { db, newRow } from '../../db/db'
import { normalize } from '../../text'
import type { FoodResult } from './api'
import { SEED_FOODS } from './seedFoods'
import type { Food, FoodEntry, FoodUnit, Meal, Nutrients, UnitKind } from './types'

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

// ---------- Medidas ----------

/** Medidas caseras de un alimento para elegir la cantidad: su porción y las demás (taza, unidad…). */
export const measuresOf = (food: { servingGrams?: number; units?: FoodUnit[] }): FoodUnit[] => [
  ...(food.servingGrams ? [{ kind: 'serving' as const, grams: food.servingGrams }] : []),
  ...(food.units ?? []),
]

export type Amount = { grams: number; unit?: UnitKind; quantity?: number }

/** Cantidad con la que se propone un alimento: 1 de su primera medida o, si no tiene, 100 g. */
export function defaultAmount(food: { servingGrams?: number; units?: FoodUnit[] }): Amount {
  const [first] = measuresOf(food)
  return first ? { grams: first.grams, unit: first.kind, quantity: 1 } : { grams: 100 }
}

// ---------- Alimentos ----------

type SeedResult = FoodResult & { aliases?: string }

const SEEDS: SeedResult[] = SEED_FOODS.map(([id, name, nameEn, kcal, protein, carbs, fat, units, aliases]) => ({
  source: 'seed',
  sourceId: id,
  name,
  nameEn,
  kcal,
  protein,
  carbs,
  fat,
  units: units.map(([kind, grams]) => ({ kind, grams })),
  aliases,
}))

/** Alimentos precargados que coinciden con la búsqueda (también por sinónimos); primero los que empiezan así. */
export function searchSeedFoods(query: string): FoodResult[] {
  const q = normalize(query.trim())
  const text = (food: SeedResult) => normalize(`${food.name} ${food.nameEn} ${food.aliases ?? ''}`)
  const matches = SEEDS.filter((food) => text(food).includes(q))
  return matches.sort((a, b) => Number(normalize(b.name).startsWith(q)) - Number(normalize(a.name).startsWith(q)))
}

/** Guarda un resultado de la búsqueda o del código de barras para tenerlo offline (una sola vez). */
export async function saveFoodResult(result: FoodResult): Promise<Food> {
  const id = `${result.source}:${result.sourceId}`
  const existing = await db.foods.get(id)
  if (existing && !existing.deletedAt) return existing
  const { name, nameEn, brand, barcode, kcal, protein, carbs, fat, servingGrams, units, source } = result
  const food: Food = { ...newRow(), id, name, nameEn, brand, barcode, kcal, protein, carbs, fat, servingGrams, units, source }
  await db.foods.put(food)
  return food
}

export type FoodValues = Pick<Food, 'name' | 'nameEn' | 'brand' | 'barcode' | 'servingGrams' | 'units'> & Nutrients

export async function createFood(values: FoodValues): Promise<Food> {
  const food: Food = { ...newRow(), ...values, source: 'custom' }
  await db.foods.add(food)
  return food
}

/** Corrige un alimento y recalcula los platos que lo usan. */
export async function updateFood(id: string, values: FoodValues) {
  await db.foods.update(id, { ...values, updatedAt: Date.now() })
  const recipes = await db.foods.filter((f) => !f.deletedAt && !!f.ingredients?.some((i) => i.foodId === id)).toArray()
  for (const recipe of recipes) {
    await db.foods.update(recipe.id, { ...recipeValues(await getIngredients(recipe), recipe.cookedGrams), updatedAt: Date.now() })
  }
  return (await db.foods.get(id))!
}

/** Borrado suave: lo ya registrado no cambia y los platos conservan sus valores. */
export function deleteFood(id: string) {
  const now = Date.now()
  return db.foods.update(id, { deletedAt: now, updatedAt: now })
}

// ---------- Platos ----------

export type RecipeItem = { food: Food; grams: number }

/**
 * Valores por 100 g de un plato: lo que suman sus ingredientes dividido por el peso del plato
 * (el cocinado si se indica, porque el arroz o las menestras cambian de peso al cocerse).
 * Sin peso cocinado, una porción es el plato entero.
 */
export function recipeValues(items: { food: Nutrients; grams: number }[], cookedGrams?: number) {
  const total = sumNutrients(items.map((i) => scaleNutrients(i.food, i.grams / 100)))
  const rawGrams = items.reduce((sum, i) => sum + i.grams, 0)
  const weight = cookedGrams || rawGrams
  return { ...scaleNutrients(total, weight ? 100 / weight : 0), servingGrams: cookedGrams ? undefined : rawGrams }
}

/** Ingredientes de un plato con su alimento (aunque luego se haya borrado). */
export async function getIngredients(recipe: Food): Promise<RecipeItem[]> {
  const ingredients = recipe.ingredients ?? []
  const foods = await db.foods.bulkGet(ingredients.map((i) => i.foodId))
  return ingredients.flatMap((ingredient, n) => (foods[n] ? [{ food: foods[n], grams: ingredient.grams }] : []))
}

export async function saveRecipe({ id, name, items, cookedGrams }: { id?: string; name: string; items: RecipeItem[]; cookedGrams?: number }) {
  const fields = {
    name,
    ingredients: items.map((i) => ({ foodId: i.food.id, grams: i.grams })),
    cookedGrams,
    ...recipeValues(items, cookedGrams),
  }
  if (id) {
    await db.foods.update(id, { ...fields, updatedAt: Date.now() })
    return (await db.foods.get(id))!
  }
  const recipe: Food = { ...newRow(), ...fields, source: 'recipe' }
  await db.foods.add(recipe)
  return recipe
}

export async function getRecipes() {
  const recipes = await db.foods.filter((f) => f.source === 'recipe' && !f.deletedAt).toArray()
  return recipes.sort((a, b) => a.name.localeCompare(b.name))
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
  return (await db.foods.toArray()).filter((f) => !f.deletedAt && normalize(`${f.name} ${f.nameEn ?? ''} ${f.brand ?? ''}`).includes(q))
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

export function addEntry(food: Food, { grams, unit, quantity }: Amount, meal: Meal, date: string) {
  const nutrients = scaleNutrients(food, grams / 100)
  const entry: FoodEntry = { ...newRow(), date, meal, foodId: food.id, name: food.name, grams, unit, quantity, ...nutrients }
  return db.foodEntries.add(entry)
}

/** Lo reconocido en una foto, revisado: cada cosa es una entrada sin alimento asociado. */
export function addPhotoEntries(items: (Nutrients & { name: string; grams: number })[], meal: Meal, date: string) {
  // createdAt + índice: se guardan en el mismo milisegundo y así conservan el orden de la foto.
  const entries = items.map(({ name, grams, kcal, protein, carbs, fat }, index): FoodEntry => {
    const row = newRow()
    return { ...row, createdAt: row.createdAt + index, date, meal, name, grams, kcal, protein, carbs, fat }
  })
  return db.foodEntries.bulkAdd(entries)
}

/** Cambia la cantidad o la comida; los nutrientes se recalculan en proporción. */
export function updateEntry(entry: FoodEntry, { grams, unit, quantity }: Amount, meal: Meal) {
  const nutrients = scaleNutrients(per100(entry), grams / 100)
  return db.foodEntries.update(entry.id, { grams, unit, quantity, meal, ...nutrients, updatedAt: Date.now() })
}

export function deleteEntry(id: string) {
  const now = Date.now()
  return db.foodEntries.update(id, { deletedAt: now, updatedAt: now })
}
