import { useEffect, useState } from 'react'
import { ApiError } from '../../api'
import { addDays, fromDateKey } from '../../dates'
import { fetchEvents, type CalendarData } from './events'

export type CalendarError = 'unauthorized' | 'disabled' | 'unavailable' | 'offline'
type Cached = CalendarData & { at: number }

// Copia por semana (clave: el lunes) para ver la agenda sin conexión; solo las más recientes.
const CACHE_KEY = 'calendar'
const MAX_WEEKS = 8

function readCache(): Record<string, Cached> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeCache(week: string, data: Cached) {
  const weeks = Object.entries({ ...readCache(), [week]: data })
    .sort(([, a], [, b]) => b.at - a.at)
    .slice(0, MAX_WEEKS)
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(weeks)))
  } catch {
    // Sin espacio: la agenda sigue funcionando, solo sin copia offline.
  }
}

/** Eventos de la semana que empieza el lunes `week`; se actualiza al volver a la app. */
export function useCalendarWeek(week: string) {
  const [state, setState] = useState<{ week: string; data?: Cached; error?: CalendarError }>(() => ({ week, data: readCache()[week] }))

  useEffect(() => {
    let cancelled = false
    setState({ week, data: readCache()[week] })
    const load = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const data = { ...(await fetchEvents(fromDateKey(week).getTime(), fromDateKey(addDays(week, 7)).getTime())), at: Date.now() }
        if (cancelled) return
        writeCache(week, data)
        setState({ week, data })
      } catch (e) {
        if (cancelled) return
        const error: CalendarError =
          e instanceof ApiError ? (e.status === 401 ? 'unauthorized' : e.status === 503 ? 'disabled' : 'unavailable') : 'offline'
        setState((s) => ({ ...s, error }))
      }
    }
    load()
    document.addEventListener('visibilitychange', load)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', load)
    }
  }, [week])

  // Justo al cambiar de semana, antes del efecto, no mostrar la anterior.
  return state.week === week ? state : { week, data: readCache()[week], error: undefined }
}
