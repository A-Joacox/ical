import { useEffect, useState } from 'react'
import { api, ApiError } from '../../api'
import type { ServerStatus } from './types'

export type StatusError = 'unauthorized' | 'unavailable' | 'offline'
type Cached = { status: ServerStatus; at: number }

const CACHE_KEY = 'serverStatus'

/** Último estado recibido (se guarda en este dispositivo para verlo sin conexión). */
export function readCachedStatus(): Cached | undefined {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') ?? undefined
  } catch {
    return undefined
  }
}

/** Consulta /api/status cada `intervalMs` mientras la app esté a la vista. */
export function useServerStatus(intervalMs = 10_000) {
  const [cached, setCached] = useState(readCachedStatus)
  const [error, setError] = useState<StatusError>()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const status = await api<ServerStatus>('/status')
        if (cancelled) return
        const next = { status, at: Date.now() }
        localStorage.setItem(CACHE_KEY, JSON.stringify(next))
        setCached(next)
        setError(undefined)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof ApiError ? (e.status === 401 ? 'unauthorized' : 'unavailable') : 'offline')
      }
    }
    load()
    const id = setInterval(load, intervalMs)
    document.addEventListener('visibilitychange', load)
    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', load)
    }
  }, [intervalMs])

  return { status: cached?.status, updatedAt: cached?.at, error }
}
