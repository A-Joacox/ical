import { describe, expect, test } from 'vitest'
import { bestSet, displayWeight, estimate1RM, formatDuration, fromKg, toKg, volumeKg } from './stats'

describe('unidades', () => {
  test('kg ↔ lb ida y vuelta conserva lo que escribió el usuario', () => {
    expect(displayWeight(toKg(135, 'lb'), 'lb')).toBe('135')
    expect(displayWeight(toKg(61.5, 'kg'), 'kg')).toBe('61.5')
  })

  test('convierte kg a lb', () => {
    expect(fromKg(100, 'lb')).toBeCloseTo(220.462)
    expect(displayWeight(100, 'lb')).toBe('220.5')
  })
})

describe('1RM y volumen', () => {
  test('Epley', () => {
    expect(estimate1RM(100, 1)).toBe(100)
    expect(estimate1RM(100, 10)).toBeCloseTo(133.33, 1)
  })

  test('volumen ignora series sin datos', () => {
    expect(volumeKg([{ weightKg: 60, reps: 10 }, { weightKg: 80, reps: 5 }, { reps: 12 }])).toBe(1000)
  })

  test('mejor serie por 1RM estimado', () => {
    const sets = [
      { id: 'a', weightKg: 100, reps: 3 },
      { id: 'b', weightKg: 90, reps: 8 },
      { id: 'c', reps: 20 },
    ]
    expect(bestSet(sets)?.id).toBe('b')
    expect(bestSet([{ reps: 10 }])).toBeUndefined()
  })
})

test('formatDuration', () => {
  expect(formatDuration(90_000)).toBe('1:30')
  expect(formatDuration(3_725_000)).toBe('1:02:05')
  expect(formatDuration(-5)).toBe('0:00')
})
