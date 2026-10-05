import { useLiveQuery } from 'dexie-react-hooks'
import type { WeightUnit } from '../features/gym/types'
import { db } from './db'

export type Goals = { kcal: number; protein: number; carbs: number; fat: number }

export const DEFAULT_GOALS: Goals = { kcal: 2200, protein: 150, carbs: 250, fat: 70 }

export function useGoals(): Goals {
  const row = useLiveQuery(() => db.settings.get('goals'))
  return { ...DEFAULT_GOALS, ...(row?.value as Partial<Goals> | undefined) }
}

export function saveGoals(goals: Goals) {
  return db.settings.put({ key: 'goals', value: goals, updatedAt: Date.now() })
}

export function useWeightUnit(): WeightUnit {
  const row = useLiveQuery(() => db.settings.get('weightUnit'))
  return row?.value === 'lb' ? 'lb' : 'kg'
}

export function saveWeightUnit(unit: WeightUnit) {
  return db.settings.put({ key: 'weightUnit', value: unit, updatedAt: Date.now() })
}
