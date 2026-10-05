import type { DatabaseSync } from 'node:sqlite'
import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { registerAuth, type AuthConfig } from './auth.ts'

export type AppOptions = {
  db: DatabaseSync
  auth: AuthConfig
  sessionSecret: string
  /** Carpeta con la PWA compilada; sin ella solo se sirve la /api (tests). */
  webDist?: string
  logger?: boolean
}

export async function buildApp({ db, auth, sessionSecret, webDist, logger = false }: AppOptions) {
  const app = Fastify({ logger })

  await app.register(fastifyCookie, { secret: sessionSecret })
  await app.register(fastifyRateLimit, { global: false })
  registerAuth(app, db, auth)

  app.get('/api/health', async () => ({ ok: true, time: new Date().toISOString() }))

  if (webDist) {
    // Sirve la PWA compilada. El SW, el HTML y el manifest se revalidan siempre para que
    // las actualizaciones lleguen al iPhone; los assets con hash se cachean para siempre.
    await app.register(fastifyStatic, {
      root: webDist,
      setHeaders(reply, filePath) {
        if (/\.(html|webmanifest)$|sw\.js$/.test(filePath)) {
          reply.header('Cache-Control', 'no-cache')
        } else if (/[\\/]assets[\\/]/.test(filePath)) {
          reply.header('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    })

    // Rutas del cliente (SPA): cualquier GET que no sea /api devuelve index.html.
    app.setNotFoundHandler((req, reply) => {
      if (req.method !== 'GET' || req.url.startsWith('/api/')) {
        return reply.code(404).send({ error: 'not_found' })
      }
      return reply.sendFile('index.html')
    })
  }

  return app
}
