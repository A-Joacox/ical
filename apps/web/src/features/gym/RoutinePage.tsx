import { useState } from 'react'
import { Block, BlockTitle, Button, Link, List, ListButton, ListInput, NavbarBackLink } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Play, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router'
import { db } from '../../db/db'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { TabPage } from '../../ui/TabPage'
import {
  addExerciseToRoutine,
  deleteRoutine,
  removeRoutineExercise,
  renameRoutine,
  startWorkout,
  updateRoutineExercise,
} from './data'
import { ExerciseThumb } from './ExerciseMedia'
import { ExercisePicker } from './ExercisePicker'
import { useExerciseMap, useExerciseName } from './hooks'
import { Navbar } from '../../ui/Navbar'

export function RoutinePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const routine = useLiveQuery(async () => (await db.routines.get(id)) ?? null, [id])
  const items = useLiveQuery(
    async () =>
      (await db.routineExercises.where('routineId').equals(id).toArray())
        .filter((i) => !i.deletedAt)
        .sort((a, b) => a.order - b.order),
    [id],
  )
  const exercises = useExerciseMap()
  const name = useExerciseName()
  const [picker, setPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (routine === undefined) return null
  if (routine === null || routine.deletedAt) return <Navigate to="/gym" replace />

  const start = async () => {
    await startWorkout(routine.name, routine.id)
    navigate('/gym/session')
  }

  return (
    <TabPage>
      <Navbar title={routine.name} left={<NavbarBackLink text={t('tabs.gym')} onClick={() => navigate('/gym')} />} />

      <List strong inset>
        <ListInput
          key={routine.name}
          label={t('gym.routineName')}
          defaultValue={routine.name}
          onBlur={(event) => {
            const value = event.target.value.trim()
            if (value) renameRoutine(routine.id, value)
            else event.target.value = routine.name
          }}
        />
      </List>

      <Block>
        <Button large rounded disabled={!items?.length} onClick={start}>
          <Play className="mr-1.5 h-5 w-5" />
          {t('gym.startRoutine')}
        </Button>
      </Block>

      <BlockTitle>{t('gym.library')}</BlockTitle>
      {items && items.length > 0 && (
        <Block strong inset className="divide-y divide-separator">
          {items.map((item) => {
            const exercise = exercises?.get(item.exerciseId)
            return (
              <div key={item.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <button
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => navigate(`/gym/exercises/${item.exerciseId}`)}
                  >
                    <ExerciseThumb exercise={exercise} />
                    <span className="truncate text-[17px] font-medium">{name(exercise)}</span>
                  </button>
                  <Link iconOnly aria-label={t('gym.removeExercise')} onClick={() => removeRoutineExercise(item.id)}>
                    <X className="h-5 w-5" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NumberField label={t('gym.setsShort')} value={item.sets} onSave={(sets) => updateRoutineExercise(item.id, { sets })} />
                  <NumberField label={t('gym.reps')} value={item.reps} onSave={(reps) => updateRoutineExercise(item.id, { reps })} />
                  <NumberField
                    label={t('gym.restShort')}
                    value={item.restSeconds}
                    onSave={(restSeconds) => updateRoutineExercise(item.id, { restSeconds })}
                  />
                </div>
              </div>
            )
          })}
        </Block>
      )}
      <List strong inset>
        <ListButton onClick={() => setPicker(true)}>{t('gym.addExercise')}</ListButton>
      </List>

      <List strong inset>
        <ListButton colors={{ textIos: 'text-danger' }} onClick={() => setConfirmDelete(true)}>
          {t('gym.deleteRoutine')}
        </ListButton>
      </List>

      <ExercisePicker opened={picker} onClose={() => setPicker(false)} onPick={(exerciseId) => addExerciseToRoutine(routine.id, exerciseId)} />
      <ConfirmDialog
        opened={confirmDelete}
        title={t('gym.deleteRoutineTitle')}
        text={routine.name}
        confirmLabel={t('gym.delete')}
        destructive
        onConfirm={async () => {
          await deleteRoutine(routine.id)
          navigate('/gym', { replace: true })
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </TabPage>
  )
}

// Campo numérico pequeño con etiqueta; guarda al salir si el valor es un entero positivo.
function NumberField({ label, value, onSave }: { label: string; value: number; onSave: (value: number) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[12px] text-label-2">
      {label}
      <input
        key={value}
        type="number"
        inputMode="numeric"
        defaultValue={value}
        className="h-9 w-full rounded-lg bg-surface-2 text-center text-[17px] tabular-nums text-white outline-none"
        onBlur={(event) => {
          const next = Math.round(Number(event.target.value))
          if (next > 0) onSave(next)
          else event.target.value = String(value)
        }}
      />
    </label>
  )
}
