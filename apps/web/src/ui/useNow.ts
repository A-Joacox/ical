import { useEffect, useState } from 'react'

/** Fecha actual (ms) que se refresca cada `intervalMs` mientras `active` sea true. */
export function useNow(intervalMs: number, active = true) {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, active])

  return now
}
