import Dexie, { type EntityTable } from 'dexie'
import { SEED_EXERCISES } from '../features/gym/seedExercises'
import type { Food, FoodEntry } from '../features/food/types'
import type { Exercise, Routine, RoutineExercise, Workout, WorkoutSet } from '../features/gym/types'

// Base de datos local (IndexedDB). Cada módulo añade sus tablas con una nueva db.version().
export type Setting = { key: string; value: unknown; updatedAt: number }

export const db = new Dexie('self-grow') as Dexie & {
  settings: EntityTable<Setting, 'key'>
  exercises: EntityTable<Exercise, 'id'>
  routines: EntityTable<Routine, 'id'>
  routineExercises: EntityTable<RoutineExercise, 'id'>
  workouts: EntityTable<Workout, 'id'>
  workoutSets: EntityTable<WorkoutSet, 'id'>
  foods: EntityTable<Food, 'id'>
  foodEntries: EntityTable<FoodEntry, 'id'>
}

db.version(1).stores({
  settings: 'key',
})

db.version(2).stores({
  exercises: 'id, muscle',
  routines: 'id',
  routineExercises: 'id, routineId',
  workouts: 'id, startedAt',
  workoutSets: 'id, workoutId, exerciseId',
})

db.version(3).stores({
  foods: 'id, barcode',
  foodEntries: 'id, date',
})

// Añade los ejercicios precargados que falten (también los que se agreguen en versiones futuras).
db.on('ready', async () => {
  const existing = new Set(await db.exercises.toCollection().primaryKeys())
  const now = Date.now()
  const missing = SEED_EXERCISES.filter(([id]) => !existing.has(id)).map(
    ([id, nameEs, nameEn, muscle, equipment]): Exercise => ({
      id,
      nameEs,
      nameEn,
      muscle,
      equipment,
      media: id,
      createdAt: now,
      updatedAt: now,
    }),
  )
  if (missing.length) await db.exercises.bulkAdd(missing)
})

/** Campos base de una fila nueva. */
export function newRow() {
  const now = Date.now()
  return { id: crypto.randomUUID(), createdAt: now, updatedAt: now }
}
