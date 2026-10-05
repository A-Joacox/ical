import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { db } from '../../db/db'
import { getActiveWorkout, getWorkoutSets } from './data'
import type { Exercise } from './types'

/** Entrenamiento en curso: undefined mientras carga, null si no hay ninguno. */
export const useActiveWorkout = () => useLiveQuery(async () => (await getActiveWorkout()) ?? null)

export const useWorkoutSets = (workoutId: string | undefined) =>
  useLiveQuery(() => (workoutId ? getWorkoutSets(workoutId) : []), [workoutId])

/** Ejercicios (sin borrar) indexados por id. */
export function useExerciseMap() {
  return useLiveQuery(async () => {
    const all = await db.exercises.toArray()
    return new Map(all.filter((e) => !e.deletedAt).map((e) => [e.id, e]))
  })
}

/** Nombre del ejercicio en el idioma de la app. */
export function useExerciseName() {
  const { i18n } = useTranslation()
  return (exercise: Exercise | undefined) => (!exercise ? '' : i18n.resolvedLanguage === 'en' ? exercise.nameEn : exercise.nameEs)
}
