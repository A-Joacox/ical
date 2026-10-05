import { api } from '../../api'
import i18n from '../../i18n'

// Pide al server una notificación push para el fin del descanso (por si el iPhone está
// bloqueado y la app pausada). Es opcional: sin notificaciones activas o sin red, no hace nada.

const pushEnabled = () => 'Notification' in window && Notification.permission === 'granted'

export function scheduleRestPush(endsAt: number) {
  const delaySeconds = Math.round((endsAt - Date.now()) / 1000)
  if (!pushEnabled() || delaySeconds <= 0) return
  api('/push/timer', { delaySeconds, title: i18n.t('gym.restDoneTitle'), body: i18n.t('gym.restDoneBody') }).catch(() => {})
}

export function cancelRestPush() {
  if (!pushEnabled()) return
  api('/push/timer/cancel', {}).catch(() => {})
}
