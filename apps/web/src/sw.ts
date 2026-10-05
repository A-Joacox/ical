import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

// Una versión nueva del SW toma el control sin esperar a que se cierre la app.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// SPA offline: toda navegación responde con el index.html precacheado, salvo la /api y
// /webhook (n8n comparte este dominio en el server).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//, /^\/webhook/] }),
)

// Notificaciones push del server (fin del descanso, alertas). iOS exige mostrar una
// notificación por cada push recibida.
type PushMessage = { title?: string; body?: string; tag?: string; url?: string }

self.addEventListener('push', (event) => {
  const message: PushMessage = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(message.title ?? 'Self Grow', {
      body: message.body,
      tag: message.tag,
      icon: '/pwa-192x192.png',
      data: { url: message.url ?? '/' },
    }),
  )
})

// Al tocar la notificación: abre la app (o la trae al frente) en la pantalla relacionada.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url: string = event.notification.data?.url ?? '/'
  event.waitUntil(
    (async () => {
      const [client] = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (!client) return self.clients.openWindow(url)
      await client.focus()
      return client.navigate(url)
    })(),
  )
})

// Fotos de los ejercicios (free-exercise-db): se guardan la primera vez que se ven para
// tenerlas en el gym sin conexión.
registerRoute(
  ({ url }) => url.origin === 'https://raw.githubusercontent.com' && url.pathname.startsWith('/yuhonas/free-exercise-db/'),
  new CacheFirst({
    cacheName: 'exercise-media',
    plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({ maxEntries: 400 })],
  }),
)
