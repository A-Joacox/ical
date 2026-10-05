import { useState } from 'react'
import { Block, BlockTitle, List, ListButton, ListItem, Navbar, NavbarBackLink } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router'
import { db } from '../../db/db'
import { useWeightUnit } from '../../db/settings'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { TabPage } from '../../ui/TabPage'
import { deleteWorkout, getWorkoutRecords } from './data'
import { useExerciseMap, useExerciseName, useWorkoutSets } from './hooks'
import { displayWeight, formatDuration, fromKg, volumeKg } from './stats'
import type { WorkoutSet } from './types'

// Resumen de un entrenamiento terminado.
export function WorkoutPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const workout = useLiveQuery(async () => (await db.workouts.get(id)) ?? null, [id])
  const sets = useWorkoutSets(id)
  const records = useLiveQuery(async () => (workout && sets ? getWorkoutRecords(workout, sets) : []), [workout, sets])
  const exercises = useExerciseMap()
  const name = useExerciseName()
  const unit = useWeightUnit()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (workout === undefined || sets === undefined) return null
  if (workout === null || workout.deletedAt || !workout.endedAt) return <Navigate to="/gym" replace />

  const setText = (set: WorkoutSet) => `${displayWeight(set.weightKg ?? 0, unit)} ${unit} × ${set.reps}`
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'full', timeStyle: 'short' }).format(workout.startedAt)
  const stats = [
    { label: t('gym.duration'), value: formatDuration(workout.endedAt - workout.startedAt) },
    { label: t('gym.volume'), value: `${Math.round(fromKg(volumeKg(sets), unit)).toLocaleString(i18n.language)} ${unit}` },
    { label: t('gym.sets'), value: String(sets.length) },
  ]

  return (
    <TabPage>
      <Navbar title={workout.name} left={<NavbarBackLink text={t('tabs.gym')} onClick={() => navigate('/gym')} />} />

      <p className="px-4 pt-4 text-[15px] text-label-2 first-letter:uppercase">{date}</p>

      <Block strong inset className="grid grid-cols-3 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-[13px] text-label-2">{stat.label}</div>
            <div className="text-[20px] font-bold tabular-nums">{stat.value}</div>
          </div>
        ))}
      </Block>

      {records && records.length > 0 && (
        <>
          <BlockTitle>{t('gym.records')}</BlockTitle>
          <List strong inset dividers>
            {records.map((set) => (
              <ListItem
                key={set.id}
                title={name(exercises?.get(set.exerciseId))}
                after={setText(set)}
                media={<Trophy className="h-6 w-6 text-warning" />}
              />
            ))}
          </List>
        </>
      )}

      {[...Map.groupBy(sets, (set) => set.exerciseOrder).values()].map((group) => (
        <div key={group[0].exerciseOrder}>
          <BlockTitle>{name(exercises?.get(group[0].exerciseId))}</BlockTitle>
          <List strong inset dividers>
            {group.map((set, index) => (
              <ListItem key={set.id} title={`${t('gym.set')} ${index + 1}`} after={setText(set)} />
            ))}
          </List>
        </div>
      ))}

      <List strong inset>
        <ListButton colors={{ textIos: 'text-danger' }} onClick={() => setConfirmDelete(true)}>
          {t('gym.deleteWorkout')}
        </ListButton>
      </List>

      <ConfirmDialog
        opened={confirmDelete}
        title={t('gym.deleteWorkoutTitle')}
        text={t('gym.deleteWorkoutText')}
        confirmLabel={t('gym.delete')}
        destructive
        onConfirm={async () => {
          await deleteWorkout(workout.id)
          navigate('/gym', { replace: true })
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </TabPage>
  )
}
