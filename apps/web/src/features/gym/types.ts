// Campos comunes de las tablas que se respaldan en el server (borrado suave con deletedAt).
export type Row = { id: string; createdAt: number; updatedAt: number; deletedAt?: number }

export const MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'other'] as const
export type Muscle = (typeof MUSCLES)[number]
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other'

export type Exercise = Row & {
  nameEs: string
  nameEn: string
  muscle: Muscle
  equipment: Equipment
  /** Carpeta de free-exercise-db con las imágenes de la animación. */
  media?: string
  custom?: boolean
}

export type Routine = Row & { name: string }

export type RoutineExercise = Row & {
  routineId: string
  exerciseId: string
  order: number
  sets: number
  reps: number
  restSeconds: number
}

export type Workout = Row & {
  name: string
  routineId?: string
  startedAt: number
  endedAt?: number
  /** Fin del descanso en curso (ms). Se guarda para sobrevivir a recargas y segundo plano. */
  restEndsAt?: number
  restSeconds?: number
}

export type WorkoutSet = Row & {
  workoutId: string
  exerciseId: string
  /** Posición del ejercicio dentro del entrenamiento. */
  exerciseOrder: number
  setIndex: number
  weightKg?: number
  reps?: number
  /** Reps objetivo de la rutina, para sugerir cuando no hay historial. */
  targetReps?: number
  restSeconds: number
  completedAt?: number
}

export type WeightUnit = 'kg' | 'lb'
