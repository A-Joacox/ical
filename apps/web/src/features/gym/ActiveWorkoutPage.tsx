import { useState } from 'react'
import { Block, Button, Link, NavbarBackLink, Page } from 'konsta/react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'
import { useWeightUnit } from '../../db/settings'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { useNow } from '../../ui/useNow'
import { addExerciseToWorkout, deleteWorkout, finishWorkout } from './data'
import { useWakeLock } from './device'
import { ExerciseCard } from './ExerciseCard'
import { ExercisePicker } from './ExercisePicker'
import { useActiveWorkout, useExerciseMap, useWorkoutSets } from './hooks'
import { RestTimerBar } from './RestTimerBar'
import { formatDuration } from './stats'
import { Navbar } from '../../ui/Navbar'

// Sesión en curso a pantalla completa (sin tab bar). Mantiene la pantalla encendida.
export function ActiveWorkoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const workout = useActiveWorkout()
  const sets = useWorkoutSets(workout?.id) ?? []
  const exercises = useExerciseMap()
  const unit = useWeightUnit()
  const now = useNow(1000)
  const [picker, setPicker] = useState(false)
  const [confirm, setConfirm] = useState<'finish' | 'discard' | null>(null)
  // Al terminar, evita que el <Navigate> a /gym gane la carrera a la navegación al resumen.
  const [leaving, setLeaving] = useState(false)
  useWakeLock()

  if (workout === undefined || leaving) return null
  if (workout === null) return <Navigate to="/gym" replace />

  const groups = Map.groupBy(sets, (set) => set.exerciseOrder)

  const finish = async () => {
    setLeaving(true)
    const saved = await finishWorkout(workout.id)
    navigate(saved ? `/gym/workouts/${workout.id}` : '/gym', { replace: true })
  }

  return (
    <Page className="pb-[calc(13rem+var(--k-safe-area-bottom))]">
      <Navbar
        title={workout.name}
        subtitle={formatDuration(now - workout.startedAt)}
        left={<NavbarBackLink text={t('tabs.gym')} onClick={() => navigate('/gym')} />}
        right={
          <Link className="font-semibold" onClick={() => setConfirm('finish')}>
            {t('gym.finish')}
          </Link>
        }
      />

      {[...groups.values()].map((group) => (
        <ExerciseCard
          key={group[0].exerciseOrder}
          exercise={exercises?.get(group[0].exerciseId)}
          sets={group}
          workoutId={workout.id}
          unit={unit}
        />
      ))}

      <Block className="space-y-3">
        <Button large rounded tonal onClick={() => setPicker(true)}>
          <Plus className="mr-1 h-5 w-5" />
          {t('gym.addExercise')}
        </Button>
        <Button large rounded clear colors={{ textIos: 'text-danger' }} onClick={() => setConfirm('discard')}>
          {t('gym.discard')}
        </Button>
      </Block>

      <ExercisePicker opened={picker} onClose={() => setPicker(false)} onPick={(id) => addExerciseToWorkout(workout.id, id)} />

      <ConfirmDialog
        opened={confirm === 'finish'}
        title={t('gym.finishTitle')}
        text={t('gym.finishText')}
        confirmLabel={t('gym.finish')}
        onConfirm={finish}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        opened={confirm === 'discard'}
        title={t('gym.discardTitle')}
        text={t('gym.discardText')}
        confirmLabel={t('gym.delete')}
        destructive
        onConfirm={async () => {
          await deleteWorkout(workout.id)
          navigate('/gym', { replace: true })
        }}
        onClose={() => setConfirm(null)}
      />

      <RestTimerBar workout={workout} />
    </Page>
  )
}
