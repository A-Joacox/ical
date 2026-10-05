import { Block, BlockTitle, Button, List, ListButton, ListItem, Navbar } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, Play, Plus, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../../db/db'
import { IconBadge } from '../../ui/IconBadge'
import { TabPage } from '../../ui/TabPage'
import { useNow } from '../../ui/useNow'
import { createRoutine, startWorkout } from './data'
import { useActiveWorkout } from './hooks'
import { formatDuration } from './stats'

export function GymPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const active = useActiveWorkout()
  const now = useNow(1000, !!active)

  const routines = useLiveQuery(async () => {
    const items = (await db.routineExercises.toArray()).filter((i) => !i.deletedAt)
    return (await db.routines.toArray())
      .filter((r) => !r.deletedAt)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((routine) => ({ ...routine, count: items.filter((i) => i.routineId === routine.id).length }))
  })
  const history = useLiveQuery(async () =>
    (await db.workouts.orderBy('startedAt').reverse().toArray()).filter((w) => w.endedAt && !w.deletedAt).slice(0, 20),
  )

  const dateFormat = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })

  const startEmpty = async () => {
    await startWorkout(t('gym.emptyWorkout'))
    navigate('/gym/session')
  }
  const newRoutine = async () => navigate(`/gym/routines/${await createRoutine(t('gym.routineDefaultName'))}`)

  return (
    <TabPage>
      <Navbar title={t('tabs.gym')} large transparent centerTitle />

      {active && (
        <List strong inset>
          <ListItem
            link
            title={t('gym.inProgress')}
            subtitle={<span className="tabular-nums">{`${active.name} · ${formatDuration(now - active.startedAt)}`}</span>}
            media={<IconBadge Icon={Timer} tone="gym" />}
            after={t('gym.resume')}
            onClick={() => navigate('/gym/session')}
          />
        </List>
      )}

      <BlockTitle>{t('gym.routines')}</BlockTitle>
      <List strong inset dividers>
        {routines?.map((routine) => (
          <ListItem
            key={routine.id}
            link
            title={routine.name}
            after={t('gym.exercisesCount', { count: routine.count })}
            media={<IconBadge Icon={Play} tone="gym" />}
            onClick={() => navigate(`/gym/routines/${routine.id}`)}
          />
        ))}
        <ListButton onClick={newRoutine}>{t('gym.newRoutine')}</ListButton>
      </List>

      {/* Lo habitual es entrar por una rutina; el entrenamiento vacío queda como opción secundaria. */}
      {!active && (
        <Block>
          <Button large rounded tonal onClick={startEmpty}>
            <Plus className="mr-1 h-5 w-5" />
            {t('gym.startEmpty')}
          </Button>
        </Block>
      )}

      <List strong inset>
        <ListItem
          link
          title={t('gym.library')}
          media={<IconBadge Icon={BookOpen} tone="agenda" />}
          onClick={() => navigate('/gym/exercises')}
        />
      </List>

      <BlockTitle>{t('gym.history')}</BlockTitle>
      {history?.length ? (
        <List strong inset dividers>
          {history.map((workout) => (
            <ListItem
              key={workout.id}
              link
              title={workout.name}
              subtitle={dateFormat.format(workout.startedAt)}
              after={formatDuration(workout.endedAt! - workout.startedAt)}
              onClick={() => navigate(`/gym/workouts/${workout.id}`)}
            />
          ))}
        </List>
      ) : (
        <Block className="text-center text-[15px] text-label-2">{t('gym.noHistory')}</Block>
      )}
    </TabPage>
  )
}
