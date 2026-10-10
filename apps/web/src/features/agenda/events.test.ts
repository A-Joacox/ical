import { describe, expect, test } from 'vitest'
import { defaultStart, eventsOfDay, newEventUrl, nextEventToday, onDay, type CalendarEvent } from './events'

// Horas locales, para que el test no dependa de la zona horaria de la máquina.
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString()
const event = (title: string, start: string, end: string, allDay = false): CalendarEvent => ({ id: title, calendar: 0, title, allDay, start, end })

const EVENTS = [
  event('Gym', at(7, 19), at(7, 20, 30)),
  event('Reunión', at(7, 9), at(7, 10)),
  event('Feriado', '2026-10-07', '2026-10-08', true),
  event('Viaje', '2026-10-08', '2026-10-11', true),
  event('Fiesta', at(7, 23), at(8, 2)),
]

describe('eventos por día', () => {
  test('todo el día primero, luego por hora; lo que cruza la medianoche sale en ambos días', () => {
    expect(eventsOfDay(EVENTS, '2026-10-07').map((e) => e.title)).toEqual(['Feriado', 'Reunión', 'Gym', 'Fiesta'])
    expect(eventsOfDay(EVENTS, '2026-10-08').map((e) => e.title)).toEqual(['Viaje', 'Fiesta'])
    expect(onDay(EVENTS[3], '2026-10-10')).toBe(true)
    expect(onDay(EVENTS[3], '2026-10-11')).toBe(false)
  })

  test('lo próximo de hoy: el siguiente con hora que no terminó; si no hay, el de todo el día', () => {
    expect(nextEventToday(EVENTS, '2026-10-07', Date.parse(at(7, 12)))?.title).toBe('Gym')
    expect(nextEventToday(EVENTS, '2026-10-07', Date.parse(at(8, 3)))?.title).toBe('Feriado')
    expect(nextEventToday([], '2026-10-07', Date.now())).toBeUndefined()
  })
})

describe('nuevo evento en Google Calendar', () => {
  test('hoy a la próxima hora en punto; otro día a la hora indicada', () => {
    const now = new Date(2026, 9, 7, 14, 25)
    expect(defaultStart('2026-10-07', 9, now)).toEqual(new Date(2026, 9, 7, 15, 0))
    expect(defaultStart('2026-10-09', 19, now)).toEqual(new Date(2026, 9, 9, 19, 0))
  })

  test('enlace con fechas locales y la zona del iPhone', () => {
    const url = new URL(newEventUrl({ title: 'Gym 💪', start: new Date(2026, 9, 9, 19, 0), minutes: 90 }))
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('dates')).toBe('20261009T190000/20261009T203000')
    expect(url.searchParams.get('text')).toBe('Gym 💪')
    expect(url.searchParams.get('ctz')).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone)
  })
})
