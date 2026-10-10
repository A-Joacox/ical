import { api } from '../../api'
import { addDays, fromDateKey } from '../../dates'

export type CalendarEvent = {
  id: string
  /** Posición del calendario (define su color). */
  calendar: number
  title: string
  location?: string
  allDay: boolean
  /** Con hora: instante ISO. Todo el día: "AAAA-MM-DD" (el fin no se incluye). */
  start: string
  end: string
}
export type CalendarInfo = { name: string; failed: boolean }
export type CalendarData = { calendars: CalendarInfo[]; events: CalendarEvent[] }

export const fetchEvents = (from: number, to: number) => api<CalendarData>(`/calendar/events?from=${from}&to=${to}`)

/** Un color por calendario, en el orden en que están configurados. */
export const CALENDAR_COLORS = ['bg-agenda', 'bg-food', 'bg-gym', 'bg-server', 'bg-protein', 'bg-carbs', 'bg-fat']
export const calendarColor = (index: number) => CALENDAR_COLORS[index % CALENDAR_COLORS.length]

/** ¿El evento ocupa parte del día local `day` ("AAAA-MM-DD")? */
export function onDay(event: CalendarEvent, day: string) {
  if (event.allDay) return event.start <= day && day < event.end
  return Date.parse(event.start) < fromDateKey(addDays(day, 1)).getTime() && Date.parse(event.end) > fromDateKey(day).getTime()
}

/** Eventos del día: primero los de todo el día y luego por hora. */
export const eventsOfDay = (events: CalendarEvent[], day: string) =>
  events.filter((e) => onDay(e, day)).sort((a, b) => Number(b.allDay) - Number(a.allDay) || Date.parse(a.start) - Date.parse(b.start))

/** Lo próximo de hoy: el siguiente evento con hora que no terminó o, si no hay, uno de todo el día. */
export function nextEventToday(events: CalendarEvent[], today: string, now: number) {
  const todays = eventsOfDay(events, today)
  return todays.find((e) => !e.allDay && Date.parse(e.end) > now) ?? todays.find((e) => e.allDay)
}

/** Hora propuesta para un evento nuevo: la próxima hora en punto si es hoy; si no, `hour` de ese día. */
export function defaultStart(day: string, hour: number, now = new Date()) {
  const start = fromDateKey(day)
  if (start.toDateString() === now.toDateString()) start.setHours(now.getHours() + 1)
  else start.setHours(hour)
  return start
}

const stamp = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T` +
  `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`

/** Formulario de Google Calendar con el evento ya rellenado (la app solo lee el calendario). */
export function newEventUrl({ title, start, minutes }: { title?: string; start: Date; minutes: number }) {
  const end = new Date(start.getTime() + minutes * 60_000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    dates: `${stamp(start)}/${stamp(end)}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  if (title) params.set('text', title)
  return `https://calendar.google.com/calendar/render?${params}`
}
