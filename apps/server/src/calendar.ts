import ICAL from 'ical.js'
import type { FastifyInstance } from 'fastify'

// Agenda de solo lectura: las "direcciones secretas en formato iCal" de los calendarios de Google.
// Se expanden los eventos repetidos (con sus excepciones) dentro del rango que pide la app.

export type CalendarEvent = {
  id: string
  /** Posición del calendario en CALENDAR_ICS_URLS (la app le da un color). */
  calendar: number
  title: string
  location?: string
  allDay: boolean
  /** Con hora: instante ISO. Todo el día: "AAAA-MM-DD" (el fin no se incluye). */
  start: string
  end: string
}

type Feed = { name: string; events: ICAL.Event[] }

const CACHE_MS = 5 * 60 * 1000
const TIMEOUT_MS = 15_000
const MAX_RANGE_MS = 62 * 24 * 60 * 60 * 1000
// Tope de repeticiones por evento (un evento diario de hace años no debe colgar la respuesta).
const MAX_OCCURRENCES = 10_000

export function parseFeed(text: string): Feed {
  const root = new ICAL.Component(ICAL.parse(text))
  // Las horas vienen en la zona del evento (TZID); Google incluye la definición de cada zona.
  for (const zone of root.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(zone)
  const all = root.getAllSubcomponents('vevent').map((component) => new ICAL.Event(component))
  const masters = new Map(all.filter((e) => !e.isRecurrenceException()).map((e) => [e.uid, e]))
  const orphans: ICAL.Event[] = []
  // Las repeticiones movidas o canceladas vienen como eventos aparte con RECURRENCE-ID.
  for (const event of all.filter((e) => e.isRecurrenceException())) {
    const master = masters.get(event.uid)
    if (master) master.relateException(event)
    else orphans.push(event)
  }
  const name = root.getFirstPropertyValue('x-wr-calname')
  return { name: typeof name === 'string' ? name : '', events: [...masters.values(), ...orphans] }
}

const isCancelled = (event: ICAL.Event) => event.component.getFirstPropertyValue('status') === 'CANCELLED'

function toEvent(event: ICAL.Event, calendar: number, start: ICAL.Time, end: ICAL.Time): CalendarEvent {
  const allDay = start.isDate
  const value = (time: ICAL.Time) => (allDay ? time.toString().slice(0, 10) : time.toJSDate().toISOString())
  return {
    id: `${event.uid}:${start.toString()}`,
    calendar,
    title: event.summary || '',
    location: event.location || undefined,
    allDay,
    start: value(start),
    end: value(end),
  }
}

/** Eventos (y repeticiones) que se cruzan con [from, to). */
export function expandFeed(feed: Feed, calendar: number, from: number, to: number): CalendarEvent[] {
  const result: CalendarEvent[] = []
  const overlaps = (start: ICAL.Time, end: ICAL.Time) => start.toJSDate().getTime() < to && end.toJSDate().getTime() > from
  for (const event of feed.events) {
    if (!event.isRecurring()) {
      if (!isCancelled(event) && overlaps(event.startDate, event.endDate)) result.push(toEvent(event, calendar, event.startDate, event.endDate))
      continue
    }
    const iterator = event.iterator()
    for (let i = 0; i < MAX_OCCURRENCES; i++) {
      const next = iterator.next()
      if (!next) break
      const { item, startDate, endDate } = event.getOccurrenceDetails(next)
      if (startDate.toJSDate().getTime() >= to) break
      if (!isCancelled(item) && overlaps(startDate, endDate)) result.push(toEvent(item, calendar, startDate, endDate))
    }
  }
  return result
}

export function registerCalendarRoutes(app: FastifyInstance, { urls }: { urls: string[] }) {
  // Google tarda en reflejar cambios en el iCal; con 5 minutos de caché no se le pide de más.
  const cache = new Map<string, { at: number; feed: Feed }>()

  async function load(url: string) {
    const cached = cache.get(url)
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.feed
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    // Sin la URL en el error: es secreta.
    if (!res.ok) throw new Error(`calendario respondió ${res.status}`)
    const feed = parseFeed(await res.text())
    cache.set(url, { at: Date.now(), feed })
    return feed
  }

  app.get<{ Querystring: { from?: string; to?: string } }>('/api/calendar/events', async (req, reply) => {
    if (!urls.length) return reply.code(503).send({ error: 'calendar_disabled' })
    const from = Number(req.query.from)
    const to = Number(req.query.to)
    if (!(from < to) || to - from > MAX_RANGE_MS) return reply.code(400).send({ error: 'invalid_range' })

    const feeds = await Promise.allSettled(urls.map(load))
    feeds.forEach((r, i) => r.status === 'rejected' && req.log.warn({ error: String(r.reason) }, `calendar ${i + 1} failed`))
    if (feeds.every((r) => r.status === 'rejected')) return reply.code(502).send({ error: 'calendar_unavailable' })
    return {
      calendars: feeds.map((r) => (r.status === 'fulfilled' ? { name: r.value.name, failed: false } : { name: '', failed: true })),
      events: feeds.flatMap((r, i) => (r.status === 'fulfilled' ? expandFeed(r.value, i, from, to) : [])),
    }
  })
}
