import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { buildApp } from './app.ts'
import { expandFeed, parseFeed } from './calendar.ts'
import { openDb } from './db.ts'

// Como lo exporta Google: gym lunes y miércoles a las 19:00 (Lima) sin el miércoles 7 y con el
// lunes 12 movido a las 20:00, un feriado de todo el día, un evento en UTC y uno cancelado.
const ICS = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
X-WR-CALNAME:Personal
X-WR-TIMEZONE:America/Lima
BEGIN:VTIMEZONE
TZID:America/Lima
BEGIN:STANDARD
TZOFFSETFROM:-0500
TZOFFSETTO:-0500
TZNAME:-05
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
DTSTART;TZID=America/Lima:20261005T190000
DTEND;TZID=America/Lima:20261005T203000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE
EXDATE;TZID=America/Lima:20261007T190000
UID:gym@google.com
SUMMARY:Gym
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=America/Lima:20261012T200000
DTEND;TZID=America/Lima:20261012T213000
RECURRENCE-ID;TZID=America/Lima:20261012T190000
UID:gym@google.com
SUMMARY:Gym (tarde)
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20261009
DTEND;VALUE=DATE:20261010
UID:feriado@google.com
SUMMARY:Feriado
END:VEVENT
BEGIN:VEVENT
DTSTART:20261008T150000Z
DTEND:20261008T160000Z
UID:dentista@google.com
SUMMARY:Dentista
LOCATION:Miraflores
END:VEVENT
BEGIN:VEVENT
DTSTART:20261006T150000Z
DTEND:20261006T160000Z
UID:cancelado@google.com
STATUS:CANCELLED
SUMMARY:Cancelado
END:VEVENT
END:VCALENDAR
`.replace(/\n/g, '\r\n')

// Lunes 5 y lunes 19 de octubre a las 00:00 en Lima (UTC-5).
const FROM = Date.parse('2026-10-05T05:00:00Z')
const TO = Date.parse('2026-10-19T05:00:00Z')

describe('expansión del iCal', () => {
  test('repeticiones con excepciones, todo el día, UTC y cancelados', () => {
    const feed = parseFeed(ICS)
    expect(feed.name).toBe('Personal')
    const events = expandFeed(feed, 0, FROM, TO).sort((a, b) => a.start.localeCompare(b.start))
    expect(events.map(({ title, start, end, allDay }) => [title, start, end, allDay])).toEqual([
      ['Gym', '2026-10-06T00:00:00.000Z', '2026-10-06T01:30:00.000Z', false],
      ['Dentista', '2026-10-08T15:00:00.000Z', '2026-10-08T16:00:00.000Z', false],
      ['Feriado', '2026-10-09', '2026-10-10', true],
      ['Gym (tarde)', '2026-10-13T01:00:00.000Z', '2026-10-13T02:30:00.000Z', false],
      ['Gym', '2026-10-15T00:00:00.000Z', '2026-10-15T01:30:00.000Z', false],
    ])
    expect(events.find((e) => e.title === 'Dentista')?.location).toBe('Miraflores')
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length)
  })

  test('solo lo que cae en el rango', () => {
    const events = expandFeed(parseFeed(ICS), 0, Date.parse('2026-10-08T05:00:00Z'), Date.parse('2026-10-09T05:00:00Z'))
    expect(events.map((e) => e.title)).toEqual(['Dentista'])
  })
})

describe('GET /api/calendar/events', () => {
  let fetches: string[]
  beforeEach(() => {
    fetches = []
    vi.stubGlobal('fetch', async (url: string) => {
      fetches.push(url)
      return url.includes('roto') ? new Response('', { status: 500 }) : new Response(ICS)
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  async function setup(calendarUrls: string[]) {
    const app = await buildApp({ db: openDb(':memory:'), sessionSecret: 's', auth: { rpID: 'localhost', origins: [] }, calendarUrls })
    const session = app.signCookie(String(Date.now() + 60_000))
    return (query: string) => app.inject({ url: `/api/calendar/events?${query}`, cookies: { sg_session: session } })
  }

  test('junta los calendarios, marca el que falla y guarda en caché', async () => {
    const get = await setup(['https://calendar.example/ical/ok/basic.ics', 'https://calendar.example/ical/roto/basic.ics'])
    const res = await get(`from=${FROM}&to=${TO}`)
    expect(res.json().calendars).toEqual([
      { name: 'Personal', failed: false },
      { name: '', failed: true },
    ])
    expect(res.json().events).toHaveLength(5)
    await get(`from=${FROM}&to=${TO}`)
    expect(fetches.filter((url) => url.includes('/ok/'))).toHaveLength(1)
  })

  test('sin calendarios → 503; rango inválido → 400; todos fallan → 502', async () => {
    expect((await (await setup([]))(`from=${FROM}&to=${TO}`)).statusCode).toBe(503)
    const get = await setup(['https://calendar.example/ical/roto/basic.ics'])
    expect((await get(`from=${TO}&to=${FROM}`)).statusCode).toBe(400)
    expect((await get(`from=${FROM}&to=${FROM + 100 * 24 * 3600 * 1000}`)).statusCode).toBe(400)
    expect((await get(`from=${FROM}&to=${TO}`)).statusCode).toBe(502)
  })
})
