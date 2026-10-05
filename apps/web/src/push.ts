import { api } from './api'

// Suscripción a notificaciones push (solo funciona con la app instalada en la pantalla de inicio).

export type PushState = 'unsupported' | 'denied' | 'off' | 'on'

// Espera al service worker (en la primera carga aún se está registrando). Sin SW, como en
// `npm run dev`, `ready` nunca se resuelve: por eso el límite de 3 s.
async function registration() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return undefined
  const timeout = new Promise<undefined>((resolve) => setTimeout(resolve, 3000))
  return Promise.race([navigator.serviceWorker.ready, timeout])
}

export async function getPushState(): Promise<PushState> {
  const reg = await registration()
  if (!reg) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return (await reg.pushManager.getSubscription()) ? 'on' : 'off'
}

// La clave pública VAPID llega en base64url; PushManager la quiere en bytes.
function base64UrlToBytes(base64Url: string) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

/** Pide permiso y registra la suscripción en el server. Llamar desde un toque del usuario. */
export async function enablePush(lang: string) {
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('permission_denied')
  const reg = await registration()
  if (!reg) throw new Error('unsupported')
  const { publicKey } = await api<{ publicKey: string }>('/push/key')
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) }))
  await api('/push/subscribe', { subscription: subscription.toJSON(), lang })
  // Con notificaciones activas, iOS respeta la petición de no borrar los datos locales.
  await navigator.storage?.persist?.()
}

/** Vuelve a enviar la suscripción (p. ej. al cambiar de idioma, para las alertas del server). */
export async function syncPush(lang: string) {
  const subscription = await (await registration())?.pushManager.getSubscription()
  if (subscription) await api('/push/subscribe', { subscription: subscription.toJSON(), lang })
}

export async function disablePush() {
  const subscription = await (await registration())?.pushManager.getSubscription()
  if (!subscription) return
  await api('/push/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {})
  await subscription.unsubscribe()
}

export const sendTestPush = (title: string, body: string) => api('/push/test', { title, body })
