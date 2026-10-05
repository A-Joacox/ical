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

// Fotos de los ejercicios (free-exercise-db): se guardan la primera vez que se ven para
// tenerlas en el gym sin conexión.
registerRoute(
  ({ url }) => url.origin === 'https://raw.githubusercontent.com' && url.pathname.startsWith('/yuhonas/free-exercise-db/'),
  new CacheFirst({
    cacheName: 'exercise-media',
    plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({ maxEntries: 400 })],
  }),
)
