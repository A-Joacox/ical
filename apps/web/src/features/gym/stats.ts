import type { WeightUnit } from './types'

const LB_PER_KG = 2.20462

export const toKg = (value: number, unit: WeightUnit) => (unit === 'kg' ? value : value / LB_PER_KG)
export const fromKg = (kg: number, unit: WeightUnit) => (unit === 'kg' ? kg : kg * LB_PER_KG)

/** Peso en la unidad elegida, redondeado a 0,1 y sin decimales sobrantes (61.2 kg, 135 lb). */
export const displayWeight = (kg: number, unit: WeightUnit) => String(Math.round(fromKg(kg, unit) * 10) / 10)

/** 1RM estimado con la fórmula de Epley. Con 1 repetición es el propio peso. */
export const estimate1RM = (weightKg: number, reps: number) => (reps <= 1 ? weightKg : weightKg * (1 + reps / 30))

type DoneSet = { weightKg?: number; reps?: number }

/** Volumen total (kg × reps) de las series. */
export const volumeKg = (sets: DoneSet[]) => sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0)

/** Serie con mejor 1RM estimado, o undefined si ninguna tiene peso y reps. */
export function bestSet<T extends DoneSet>(sets: T[]): T | undefined {
  let best: T | undefined
  let bestValue = 0
  for (const set of sets) {
    if (!set.weightKg || !set.reps) continue
    const value = estimate1RM(set.weightKg, set.reps)
    if (value > bestValue) {
      best = set
      bestValue = value
    }
  }
  return best
}

/** "m:ss" para descansos y "h:mm:ss" cuando pasa de una hora. */
export function formatDuration(ms: number) {
  const total = Math.max(Math.round(ms / 1000), 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}
