import { useState } from 'react'
import { Actions, ActionsButton, ActionsGroup, ActionsLabel, Block, BlockTitle, Link, List, ListItem } from 'konsta/react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { addDays, dateKey, fromDateKey, startOfWeek } from '../../dates'
import { Navbar } from '../../ui/Navbar'
import { TabPage } from '../../ui/TabPage'
import { calendarColor, defaultStart, eventsOfDay, newEventUrl, onDay } from './events'
import { useCalendarWeek } from './useCalendarWeek'

// Agenda de solo lectura (Google Calendar): semana, eventos del día elegido y atajos para crear.
export function AgendaPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const today = dateKey(new Date())
  const [day, setDay] = useState(today)
  const [creating, setCreating] = useState(false)
  const week = startOfWeek(day)
  const { data, error } = useCalendarWeek(week)
  const events = data?.events ?? []
  const dayEvents = eventsOfDay(events, day)

  const format = (options: Intl.DateTimeFormatOptions, date: Date) => new Intl.DateTimeFormat(lang, options).format(date)
  const time = (iso: string) => format({ timeStyle: 'short' }, new Date(iso))
  const relative = { [today]: t('agenda.today'), [addDays(today, 1)]: t('agenda.tomorrow'), [addDays(today, -1)]: t('agenda.yesterday') }[day]
  const dayLabel = [relative, format({ weekday: 'long', day: 'numeric', month: 'long' }, fromDateKey(day))].filter(Boolean).join(' · ')

  const status = (() => {
    const at = data && format({ timeStyle: 'short' }, new Date(data.at))
    if (error === 'disabled') return t('agenda.disabled')
    if (error === 'unauthorized') return t('agenda.signIn')
    if (error) return at ? t('agenda.cachedAt', { time: at }) : t(error === 'offline' ? 'server.offline' : 'agenda.unavailable')
    if (!data) return ''
    return [t('agenda.updated', { time: at }), data.calendars.some((c) => c.failed) && t('agenda.someFailed')].filter(Boolean).join(' · ')
  })()

  const create = (title: string | undefined, hour: number, minutes: number) => {
    setCreating(false)
    window.open(newEventUrl({ title, start: defaultStart(day, hour), minutes }), '_blank')
  }

  return (
    <TabPage>
      <Navbar
        title={t('tabs.agenda')}
        large
        transparent
        centerTitle
        right={
          <Link iconOnly aria-label={t('agenda.newEvent')} onClick={() => setCreating(true)}>
            <Plus className="h-6 w-6" />
          </Link>
        }
      />

      <div className="px-2">
        <div className="flex items-center justify-between">
          <button className="flex h-11 w-11 items-center justify-center rounded-full text-agenda active:bg-white/10" aria-label="‹" onClick={() => setDay(addDays(day, -7))}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button className="text-[17px] font-semibold first-letter:uppercase" onClick={() => setDay(today)}>
            {format({ month: 'long', year: 'numeric' }, fromDateKey(day))}
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-full text-agenda active:bg-white/10" aria-label="›" onClick={() => setDay(addDays(day, 7))}>
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-1 grid grid-cols-7 text-center">
          {Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((d) => {
            const selected = d === day
            const isToday = d === today
            const circle = selected ? (isToday ? 'bg-agenda text-white' : 'bg-white text-black') : isToday ? 'text-agenda' : ''
            return (
              <button key={d} className="flex flex-col items-center gap-1 py-1" onClick={() => setDay(d)}>
                <span className="text-[12px] uppercase text-label-2">{format({ weekday: 'narrow' }, fromDateKey(d))}</span>
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[17px] font-semibold tabular-nums ${circle}`}>
                  {fromDateKey(d).getDate()}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${events.some((e) => onDay(e, d)) ? 'bg-label-2' : ''}`} />
              </button>
            )
          })}
        </div>
      </div>

      <BlockTitle className="first-letter:uppercase">{dayLabel}</BlockTitle>
      {dayEvents.length > 0 ? (
        <List strong inset dividers>
          {dayEvents.map((event) => (
            <ListItem
              key={event.id}
              media={<span className={`block h-9 w-1 rounded-full ${calendarColor(event.calendar)}`} />}
              title={event.title || t('agenda.untitled')}
              subtitle={event.location}
              after={<span className="tabular-nums">{event.allDay ? t('agenda.allDay') : `${time(event.start)} – ${time(event.end)}`}</span>}
            />
          ))}
        </List>
      ) : (
        data && <Block className="text-center text-[15px] text-label-2">{t('agenda.empty')}</Block>
      )}

      <div className="mt-6 space-y-2 px-4 text-center text-[13px] text-label-2">
        {data && data.calendars.length > 1 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {data.calendars.map((calendar, index) => (
              <span key={index} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${calendarColor(index)}`} />
                {calendar.name || t('agenda.calendar', { n: index + 1 })}
              </span>
            ))}
          </div>
        )}
        <p>{status}</p>
      </div>

      <Actions opened={creating} onBackdropClick={() => setCreating(false)}>
        <ActionsGroup>
          <ActionsLabel className="first-letter:uppercase">{dayLabel}</ActionsLabel>
          <ActionsButton onClick={() => create(undefined, 9, 60)}>{t('agenda.newEvent')}</ActionsButton>
          <ActionsButton onClick={() => create(t('agenda.workoutTitle'), 19, 90)}>{t('agenda.scheduleWorkout')}</ActionsButton>
        </ActionsGroup>
        <ActionsGroup>
          <ActionsButton bold onClick={() => setCreating(false)}>
            {t('gym.cancel')}
          </ActionsButton>
        </ActionsGroup>
      </Actions>
    </TabPage>
  )
}
