import { Block, Button, Link, List, ListItem } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, Dumbbell, Plus, Server, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../../db/db'
import { dateKey, startOfWeek } from '../../dates'
import { nextEventToday } from '../agenda/events'
import { useCalendarWeek } from '../agenda/useCalendarWeek'
import { sumNutrients } from '../food/data'
import { DaySummary } from '../food/DaySummary'
import { useDayEntries } from '../food/hooks'
import { ActiveWorkoutCard } from '../gym/ActiveWorkoutCard'
import { useActiveWorkout } from '../gym/hooks'
import { IconBadge } from '../../ui/IconBadge'
import { TabPage } from '../../ui/TabPage'
import { useServerHealth } from '../server/useServerHealth'
import { readCachedStatus } from '../server/useServerStatus'
import { Navbar } from '../../ui/Navbar'

const HEALTH_DOT = { checking: 'bg-label-2', online: 'bg-food', offline: 'bg-danger' } as const

export function TodayPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const today = dateKey(new Date())
  const entries = useDayEntries(today) ?? []
  const agenda = useCalendarWeek(startOfWeek(today))
  const nextEvent = nextEventToday(agenda.data?.events ?? [], today, Date.now())
  const eventTime = (iso: string) => new Intl.DateTimeFormat(i18n.language, { timeStyle: 'short' }).format(new Date(iso))
  const health = useServerHealth()
  // Temperatura de la última lectura guardada (la pestaña Server la actualiza).
  const cachedStatus = readCachedStatus()?.status
  const maxTemp = Math.max(0, ...(cachedStatus?.temps.map((s) => s.value) ?? []))
  const activeWorkout = useActiveWorkout()
  const workoutsToday = useLiveQuery(() =>
    db.workouts
      .where('startedAt')
      .aboveOrEqual(new Date().setHours(0, 0, 0, 0))
      .filter((w) => !!w.endedAt && !w.deletedAt)
      .count(),
  )
  const date = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const gymStatus = activeWorkout ? t('today.gymInProgress') : workoutsToday ? t('today.gymDone') : t('today.noWorkout')

  return (
    <TabPage>
      <Navbar
        title={t('tabs.today')}
        large
        transparent
        centerTitle
        right={
          <Link iconOnly aria-label={t('settings.title')} onClick={() => navigate('/settings')}>
            <Settings className="h-6 w-6" />
          </Link>
        }
      />

      <p className="-mt-2 px-4 text-[15px] font-medium text-label-2 first-letter:uppercase">{date}</p>

      {activeWorkout && <ActiveWorkoutCard workout={activeWorkout} />}

      <DaySummary eaten={sumNutrients(entries)} />

      <List strong inset dividers>
        <ListItem
          link
          title={t('tabs.gym')}
          after={gymStatus}
          media={<IconBadge Icon={Dumbbell} tone="gym" />}
          onClick={() => navigate(activeWorkout ? '/gym/session' : '/gym')}
        />
        <ListItem
          link
          title={t('tabs.agenda')}
          after={nextEvent ? (nextEvent.allDay ? nextEvent.title : `${eventTime(nextEvent.start)} · ${nextEvent.title}`) : t('today.noEvents')}
          media={<IconBadge Icon={CalendarDays} tone="agenda" />}
          onClick={() => navigate('/agenda')}
        />
        <ListItem
          link
          title={t('tabs.server')}
          after={
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${HEALTH_DOT[health]}`} />
              {t(`server.${health}`)}
              {health === 'online' && maxTemp > 0 && ` · ${Math.round(maxTemp)} °C`}
            </span>
          }
          media={<IconBadge Icon={Server} tone="server" />}
          onClick={() => navigate('/server')}
        />
      </List>

      <Block className="flex gap-3">
        <Button large rounded tonal onClick={() => navigate('/food')}>
          <Plus className="mr-1 h-5 w-5" />
          {t('today.addFood')}
        </Button>
        <Button large rounded onClick={() => navigate(activeWorkout ? '/gym/session' : '/gym')}>
          <Dumbbell className="mr-1.5 h-5 w-5" />
          {t('today.startGym')}
        </Button>
      </Block>
    </TabPage>
  )
}
