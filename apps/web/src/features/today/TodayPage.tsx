import { Block, Button, Link, List, ListItem } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, Dumbbell, Plus, Server, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../../db/db'
import { useGoals } from '../../db/settings'
import { useActiveWorkout } from '../gym/hooks'
import { IconBadge } from '../../ui/IconBadge'
import { MacroBars } from '../../ui/MacroBars'
import { ProgressRing } from '../../ui/ProgressRing'
import { TabPage } from '../../ui/TabPage'
import { useServerHealth } from '../server/useServerHealth'
import { readCachedStatus } from '../server/useServerStatus'
import { Navbar } from '../../ui/Navbar'

const HEALTH_DOT = { checking: 'bg-label-2', online: 'bg-food', offline: 'bg-danger' } as const

// Lo consumido llegará con el registro de comidas (fase 5); por ahora el día empieza en cero.
const EATEN = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

export function TodayPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const goals = useGoals()
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
  const kcalLeft = Math.max(goals.kcal - EATEN.kcal, 0)
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

      <Block strong inset className="flex items-center gap-5">
        <ProgressRing progress={EATEN.kcal / goals.kcal} colorClassName="text-food">
          <span className="text-[28px] font-bold leading-none tabular-nums">{kcalLeft.toLocaleString(i18n.language)}</span>
          <span className="mt-1 text-[12px] text-label-2">{t('today.kcalLeft')}</span>
        </ProgressRing>
        <MacroBars eaten={EATEN} goals={goals} />
      </Block>

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
          after={t('today.noEvents')}
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
