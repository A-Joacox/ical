import type { Table } from 'dexie'
import { db, newRow } from '../../db/db'
import { bestSet, estimate1RM } from './stats'
import type { Muscle, Routine, RoutineExercise, Workout, WorkoutSet } from './types'

export const DEFAULT_REST_SECONDS = 90

const alive = <T extends { deletedAt?: number }>(rows: T[]) => rows.filter((row) => !row.deletedAt)
const bySetOrder = (a: WorkoutSet, b: WorkoutSet) => a.exerciseOrder - b.exerciseOrder || a.setIndex - b.setIndex

// `any`: sirve para cualquier tabla con borrado suave.
function softDelete(table: Table<any, string>, ids: string[]) {
  const now = Date.now()
  return table.bulkUpdate(ids.map((key) => ({ key, changes: { deletedAt: now, updatedAt: now } })))
}

// ---------- Consultas ----------

export const getActiveWorkout = () => db.workouts.filter((w) => !w.endedAt && !w.deletedAt).first()

export async function getWorkoutSets(workoutId: string) {
  return alive(await db.workoutSets.where('workoutId').equals(workoutId).toArray()).sort(bySetOrder)
}

/** Series completadas de la última vez que se hizo el ejercicio (excluyendo el entrenamiento actual). */
export async function getLastSets(exerciseId: string, excludeWorkoutId?: string) {
  const sets = alive(await db.workoutSets.where('exerciseId').equals(exerciseId).toArray()).filter(
    (s) => s.completedAt && s.workoutId !== excludeWorkoutId,
  )
  if (!sets.length) return []
  const latest = sets.reduce((a, b) => (b.completedAt! > a.completedAt! ? b : a)).workoutId
  return sets.filter((s) => s.workoutId === latest).sort(bySetOrder)
}

/** Sesiones en las que se hizo el ejercicio (más reciente primero) con su mejor serie. */
export async function getExerciseHistory(exerciseId: string) {
  const sets = alive(await db.workoutSets.where('exerciseId').equals(exerciseId).toArray()).filter((s) => s.completedAt)
  const byWorkout = Map.groupBy(sets, (s) => s.workoutId)
  return [...byWorkout.values()]
    .map((workoutSets) => ({
      workoutId: workoutSets[0].workoutId,
      date: Math.max(...workoutSets.map((s) => s.completedAt!)),
      best: bestSet(workoutSets),
      maxWeightKg: Math.max(...workoutSets.map((s) => s.weightKg ?? 0)),
    }))
    .sort((a, b) => b.date - a.date)
}

/** Ejercicios del entrenamiento cuya mejor serie supera el 1RM estimado de todas las sesiones anteriores. */
export async function getWorkoutRecords(workout: Workout, sets: WorkoutSet[]) {
  const records: WorkoutSet[] = []
  for (const exerciseId of new Set(sets.map((s) => s.exerciseId))) {
    const best = bestSet(sets.filter((s) => s.exerciseId === exerciseId))
    if (!best) continue
    const earlier = alive(await db.workoutSets.where('exerciseId').equals(exerciseId).toArray()).filter(
      (s) => s.completedAt && s.completedAt < workout.startedAt,
    )
    const previous = bestSet(earlier)
    if (previous && estimate1RM(best.weightKg!, best.reps!) > estimate1RM(previous.weightKg!, previous.reps!)) {
      records.push(best)
    }
  }
  return records
}

// ---------- Entrenamiento ----------

/** Empieza un entrenamiento (vacío o desde una rutina). Si ya hay uno activo, devuelve ese. */
export async function startWorkout(name: string, routineId?: string) {
  const active = await getActiveWorkout()
  if (active) return active.id

  const workout: Workout = { ...newRow(), name, routineId, startedAt: Date.now() }
  await db.transaction('rw', db.workouts, db.workoutSets, db.routineExercises, async () => {
    await db.workouts.add(workout)
    if (!routineId) return
    const items = alive(await db.routineExercises.where('routineId').equals(routineId).toArray()).sort(
      (a, b) => a.order - b.order,
    )
    const sets = items.flatMap((item, exerciseOrder) =>
      Array.from(
        { length: item.sets },
        (_, setIndex): WorkoutSet => ({
          ...newRow(),
          workoutId: workout.id,
          exerciseId: item.exerciseId,
          exerciseOrder,
          setIndex,
          targetReps: item.reps,
          restSeconds: item.restSeconds,
        }),
      ),
    )
    await db.workoutSets.bulkAdd(sets)
  })
  return workout.id
}

export async function addExerciseToWorkout(workoutId: string, exerciseId: string) {
  const sets = await getWorkoutSets(workoutId)
  const exerciseOrder = sets.length ? Math.max(...sets.map((s) => s.exerciseOrder)) + 1 : 0
  await db.workoutSets.add({
    ...newRow(),
    workoutId,
    exerciseId,
    exerciseOrder,
    setIndex: 0,
    restSeconds: DEFAULT_REST_SECONDS,
  })
}

/** Añade una serie al final del ejercicio, con su mismo descanso y reps objetivo. */
export async function addSet(last: WorkoutSet) {
  await db.workoutSets.add({
    ...newRow(),
    workoutId: last.workoutId,
    exerciseId: last.exerciseId,
    exerciseOrder: last.exerciseOrder,
    setIndex: last.setIndex + 1,
    targetReps: last.targetReps,
    restSeconds: last.restSeconds,
  })
}

export const removeSet = (set: WorkoutSet) => softDelete(db.workoutSets, [set.id])

/** Guarda lo escrito en la serie aunque aún no esté completada (sobrevive a recargas). */
export const updateSetValues = (set: WorkoutSet, values: { weightKg?: number; reps?: number }) =>
  db.workoutSets.update(set.id, { ...values, updatedAt: Date.now() })

export async function removeExerciseFromWorkout(workoutId: string, exerciseOrder: number) {
  const sets = (await getWorkoutSets(workoutId)).filter((s) => s.exerciseOrder === exerciseOrder)
  await softDelete(
    db.workoutSets,
    sets.map((s) => s.id),
  )
}

/** Marca la serie como hecha e inicia el descanso. */
export async function completeSet(set: WorkoutSet, values: { weightKg?: number; reps: number }) {
  const now = Date.now()
  await db.transaction('rw', db.workoutSets, db.workouts, async () => {
    await db.workoutSets.update(set.id, { ...values, completedAt: now, updatedAt: now })
    await db.workouts.update(set.workoutId, {
      restEndsAt: now + set.restSeconds * 1000,
      restSeconds: set.restSeconds,
      updatedAt: now,
    })
  })
}

export const uncompleteSet = (set: WorkoutSet) =>
  db.workoutSets.update(set.id, { completedAt: undefined, updatedAt: Date.now() })

export function adjustRest(workout: Workout, deltaSeconds: number) {
  if (!workout.restEndsAt) return
  const now = Date.now()
  return db.workouts.update(workout.id, {
    restEndsAt: Math.max(workout.restEndsAt + deltaSeconds * 1000, now),
    restSeconds: Math.max((workout.restSeconds ?? 0) + deltaSeconds, 0),
    updatedAt: now,
  })
}

export const clearRest = (workoutId: string) =>
  db.workouts.update(workoutId, { restEndsAt: undefined, restSeconds: undefined, updatedAt: Date.now() })

/** Termina el entrenamiento descartando series sin completar. Si no queda ninguna, lo descarta. */
export async function finishWorkout(workoutId: string) {
  return db.transaction('rw', db.workouts, db.workoutSets, async () => {
    const sets = await getWorkoutSets(workoutId)
    const pending = sets.filter((s) => !s.completedAt)
    await softDelete(
      db.workoutSets,
      pending.map((s) => s.id),
    )
    if (pending.length === sets.length) {
      await softDelete(db.workouts, [workoutId])
      return false
    }
    const now = Date.now()
    await db.workouts.update(workoutId, { endedAt: now, restEndsAt: undefined, restSeconds: undefined, updatedAt: now })
    return true
  })
}

export async function deleteWorkout(workoutId: string) {
  await db.transaction('rw', db.workouts, db.workoutSets, async () => {
    const sets = await getWorkoutSets(workoutId)
    await softDelete(
      db.workoutSets,
      sets.map((s) => s.id),
    )
    await softDelete(db.workouts, [workoutId])
  })
}

// ---------- Rutinas ----------

export async function createRoutine(name: string) {
  const routine: Routine = { ...newRow(), name }
  await db.routines.add(routine)
  return routine.id
}

export const renameRoutine = (id: string, name: string) => db.routines.update(id, { name, updatedAt: Date.now() })

export async function addExerciseToRoutine(routineId: string, exerciseId: string) {
  const items = alive(await db.routineExercises.where('routineId').equals(routineId).toArray())
  await db.routineExercises.add({
    ...newRow(),
    routineId,
    exerciseId,
    order: items.length ? Math.max(...items.map((i) => i.order)) + 1 : 0,
    sets: 3,
    reps: 10,
    restSeconds: DEFAULT_REST_SECONDS,
  })
}

export const updateRoutineExercise = (id: string, changes: Partial<Pick<RoutineExercise, 'sets' | 'reps' | 'restSeconds'>>) =>
  db.routineExercises.update(id, { ...changes, updatedAt: Date.now() })

export const removeRoutineExercise = (id: string) => softDelete(db.routineExercises, [id])

export async function deleteRoutine(routineId: string) {
  await db.transaction('rw', db.routines, db.routineExercises, async () => {
    const items = await db.routineExercises.where('routineId').equals(routineId).toArray()
    await softDelete(
      db.routineExercises,
      items.map((i) => i.id),
    )
    await softDelete(db.routines, [routineId])
  })
}

// ---------- Ejercicios propios ----------

export async function createExercise(name: string, muscle: Muscle = 'other') {
  const row = newRow()
  await db.exercises.add({ ...row, nameEs: name, nameEn: name, muscle, equipment: 'other', custom: true })
  return row.id
}
