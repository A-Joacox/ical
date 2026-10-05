import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNow } from '../../ui/useNow'
import { adjustRest, clearRest } from './data'
import { beep } from './device'
import { cancelRestPush } from './restPush'
import { formatDuration } from './stats'
import type { Workout } from './types'

// Cuenta regresiva del descanso, fija abajo. Se calcula contra la hora de fin guardada,
// así que sigue siendo correcta tras pasar a segundo plano o recargar.
export function RestTimerBar({ workout }: { workout: Workout }) {
  const { t } = useTranslation()
  const running = workout.restEndsAt !== undefined
  const now = useNow(250, running)
  const remaining = (workout.restEndsAt ?? 0) - now
  const finished = running && remaining <= 0
  const nearEnd = running && remaining < 2500

  // Con la app a la vista basta el pitido: se cancela la notificación push justo antes de que
  // salga. Si el iPhone está bloqueado, la app está pausada, esto no se ejecuta y la push llega.
  useEffect(() => {
    if (nearEnd && document.visibilityState === 'visible') cancelRestPush()
  }, [nearEnd])

  // Se ejecuta solo al pasar a terminado. Suena únicamente si la app estaba abierta en ese
  // momento (no al volver mucho después).
  useEffect(() => {
    if (!finished) return
    if (remaining > -3000) beep()
    clearRest(workout.id)
  }, [finished])

  if (!running || finished) return null
  const total = (workout.restSeconds ?? 0) * 1000
  const step = 'h-11 w-16 rounded-full bg-white/10 text-[15px] font-semibold active:bg-white/20'

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(var(--k-safe-area-bottom)+8px)]">
      <div className="rounded-3xl bg-surface-2/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button className={step} onClick={() => adjustRest(workout, -15)}>
            −15
          </button>
          <div className="text-center">
            <div className="text-[13px] font-medium text-label-2">{t('gym.rest')}</div>
            <div className="text-[40px] font-bold leading-tight tabular-nums text-gym">
              {formatDuration(Math.ceil(remaining / 1000) * 1000)}
            </div>
          </div>
          <button className={step} onClick={() => adjustRest(workout, 15)}>
            +15
          </button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/40">
          <div className="h-full rounded-full bg-gym" style={{ width: `${total ? (remaining / total) * 100 : 0}%` }} />
        </div>
        <button className="mt-3 w-full text-[15px] font-semibold text-agenda" onClick={() => clearRest(workout.id)}>
          {t('gym.skip')}
        </button>
      </div>
    </div>
  )
}
