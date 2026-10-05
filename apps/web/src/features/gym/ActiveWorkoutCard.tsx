import { Block } from 'konsta/react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useNow } from '../../ui/useNow'
import { ExerciseThumb } from './ExerciseMedia'
import { useExerciseMap, useExerciseName, useWorkoutSets } from './hooks'
import { formatDuration, nextSet } from './stats'
import type { Workout } from './types'

// Resumen del entrenamiento en curso para la pantalla Hoy: el ejercicio y la serie que tocan y
// lo que queda de descanso. Al tocarlo vuelve a la sesión.
export function ActiveWorkoutCard({ workout }: { workout: Workout }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sets = useWorkoutSets(workout.id) ?? []
  const exercises = useExerciseMap()
  const name = useExerciseName()
  // El descanso se da por terminado al llegar a cero (lo limpia la pantalla de la sesión).
  const now = useNow(250, (workout.restEndsAt ?? 0) > Date.now())
  const remaining = (workout.restEndsAt ?? 0) - now
  const next = nextSet(sets)
  const group = sets.filter((s) => s.exerciseOrder === next?.exerciseOrder)
  const exercise = next && exercises?.get(next.exerciseId)

  return (
    <Block strong inset>
      <button className="flex w-full items-center gap-3 text-left" onClick={() => navigate('/gym/session')}>
        <ExerciseThumb exercise={exercise} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-gym">{workout.name}</div>
          <div className="truncate text-[17px] font-semibold">{next ? name(exercise) : t('today.allSetsDone')}</div>
          {next && (
            <div className="text-[13px] text-label-2">{t('today.setOf', { set: group.indexOf(next) + 1, total: group.length })}</div>
          )}
        </div>
        {remaining > 0 ? (
          <div className="shrink-0 text-right">
            <div className="text-[12px] font-medium text-label-2">{t('gym.rest')}</div>
            <div className="text-[28px] font-bold leading-tight tabular-nums text-gym">
              {formatDuration(Math.ceil(remaining / 1000) * 1000)}
            </div>
          </div>
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-label-2" />
        )}
      </button>
    </Block>
  )
}
