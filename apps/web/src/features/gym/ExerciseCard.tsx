import { useState } from 'react'
import { Actions, ActionsButton, ActionsGroup, Block, Button, Link } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Ellipsis, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  addSet,
  completeSet,
  getLastSets,
  removeExerciseFromWorkout,
  removeSet,
  uncompleteSet,
  updateSetValues,
} from './data'
import { unlockAudio } from './device'
import { ExerciseThumb } from './ExerciseMedia'
import { useExerciseName } from './hooks'
import { displayWeight, toKg } from './stats'
import type { Exercise, WeightUnit, WorkoutSet } from './types'

const GRID = 'grid grid-cols-[2rem_1fr_4.5rem_4rem_2.5rem] items-center gap-2'

// Acepta coma decimal (teclado en español). Vacío o inválido → undefined.
function parseNumber(text: string) {
  const value = Number(text.replace(',', '.'))
  return text.trim() && Number.isFinite(value) && value >= 0 ? value : undefined
}

type Props = { exercise: Exercise | undefined; sets: WorkoutSet[]; workoutId: string; unit: WeightUnit }

// Un ejercicio de la sesión activa: sus series con lo hecho la última vez como referencia.
export function ExerciseCard({ exercise, sets, workoutId, unit }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const name = useExerciseName()
  const [menu, setMenu] = useState<WorkoutSet | 'exercise' | null>(null)
  const exerciseId = sets[0].exerciseId
  const lastSets = useLiveQuery(() => getLastSets(exerciseId, workoutId), [exerciseId, workoutId]) ?? []

  const closeMenu = () => setMenu(null)

  return (
    <Block strong inset className="space-y-2">
      <div className="flex items-center gap-3">
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => navigate(`/gym/exercises/${exerciseId}`)}>
          <ExerciseThumb exercise={exercise} />
          <span className="truncate text-[17px] font-semibold text-gym">{name(exercise)}</span>
        </button>
        <Link iconOnly aria-label={t('gym.removeExercise')} onClick={() => setMenu('exercise')}>
          <Ellipsis className="h-6 w-6" />
        </Link>
      </div>

      <div className={`${GRID} text-center text-[12px] font-medium uppercase text-label-2`}>
        <span>{t('gym.set')}</span>
        <span>{t('gym.previous')}</span>
        <span>{unit}</span>
        <span>{t('gym.reps')}</span>
        <span />
      </div>

      {sets.map((set, index) => (
        <SetRow key={`${set.id}-${unit}`} set={set} index={index} previous={lastSets[index]} unit={unit} onMenu={() => setMenu(set)} />
      ))}

      <Button clear small rounded onClick={() => addSet(sets[sets.length - 1])}>
        <Plus className="mr-1 h-4 w-4" />
        {t('gym.addSet')}
      </Button>

      <Actions opened={menu !== null} onBackdropClick={closeMenu}>
        <ActionsGroup>
          {menu === 'exercise' ? (
            <ActionsButton
              colors={{ textIos: 'text-danger' }}
              onClick={() => {
                closeMenu()
                removeExerciseFromWorkout(workoutId, sets[0].exerciseOrder)
              }}
            >
              {t('gym.removeExercise')}
            </ActionsButton>
          ) : (
            <ActionsButton
              colors={{ textIos: 'text-danger' }}
              onClick={() => {
                closeMenu()
                if (menu) removeSet(menu)
              }}
            >
              {t('gym.removeSet')}
            </ActionsButton>
          )}
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton bold onClick={closeMenu}>
            {t('gym.cancel')}
          </ActionsButton>
        </ActionsGroup>
      </Actions>
    </Block>
  )
}

type SetRowProps = { set: WorkoutSet; index: number; previous: WorkoutSet | undefined; unit: WeightUnit; onMenu: () => void }

function SetRow({ set, index, previous, unit, onMenu }: SetRowProps) {
  const [weight, setWeight] = useState(set.weightKg !== undefined ? displayWeight(set.weightKg, unit) : '')
  const [reps, setReps] = useState(set.reps !== undefined ? String(set.reps) : '')
  const done = set.completedAt !== undefined

  // Sugerencias: lo de la última vez o, si no hay, las reps objetivo de la rutina.
  const weightHint = previous?.weightKg !== undefined ? displayWeight(previous.weightKg, unit) : ''
  const repsHint = previous?.reps ?? set.targetReps
  const previousText = previous?.reps ? `${weightHint || 0}×${previous.reps}` : '—'

  const weightKg = (text: string) => {
    const value = parseNumber(text)
    return value === undefined ? undefined : toKg(value, unit)
  }

  const toggle = () => {
    unlockAudio()
    if (done) return uncompleteSet(set)
    const finalReps = parseNumber(reps) ?? repsHint
    if (!finalReps) return
    const finalWeight = weight || weightHint
    setWeight(finalWeight)
    setReps(String(finalReps))
    completeSet(set, { weightKg: weightKg(finalWeight), reps: finalReps })
  }

  const input = 'h-9 w-full rounded-lg bg-surface-2 text-center text-[17px] tabular-nums outline-none placeholder:text-label-2/70'

  return (
    <div className={`${GRID} -mx-2 rounded-xl px-2 py-1 ${done ? 'bg-food/15' : ''}`}>
      <button className="h-9 text-center font-semibold tabular-nums" onClick={onMenu}>
        {index + 1}
      </button>
      <span className="truncate text-center text-[15px] tabular-nums text-label-2">{previousText}</span>
      <input
        className={input}
        inputMode="decimal"
        placeholder={weightHint}
        value={weight}
        onChange={(event) => setWeight(event.target.value)}
        onBlur={() => updateSetValues(set, { weightKg: weightKg(weight) })}
      />
      <input
        className={input}
        inputMode="numeric"
        placeholder={repsHint ? String(repsHint) : ''}
        value={reps}
        onChange={(event) => setReps(event.target.value)}
        onBlur={() => updateSetValues(set, { reps: parseNumber(reps) })}
      />
      <button
        aria-label="✓"
        className={`flex h-9 w-full items-center justify-center rounded-lg ${done ? 'bg-food text-white' : 'bg-surface-2 text-label-2'}`}
        onClick={toggle}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </button>
    </div>
  )
}
