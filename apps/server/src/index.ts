import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildApp } from './app.ts'
import { openDb } from './db.ts'

const env = process.env
const port = Number(env.PORT ?? 3000)
const host = env.HOST ?? '0.0.0.0'
const dataDir = env.DATA_DIR ?? fileURLToPath(new URL('../../../data', import.meta.url))
const webDist = env.WEB_DIST ?? fileURLToPath(new URL('../../web/dist', import.meta.url))

if (env.NODE_ENV === 'production' && !env.SESSION_SECRET) {
  throw new Error('Falta SESSION_SECRET en apps/server/.env')
}

mkdirSync(dataDir, { recursive: true })

const app = await buildApp({
  db: openDb(join(dataDir, 'self-grow.db')),
  sessionSecret: env.SESSION_SECRET ?? 'dev-only-secret',
  auth: {
    rpID: env.RP_ID ?? 'localhost',
    origins: (env.ORIGIN ?? 'http://localhost:3000,http://localhost:5173').split(','),
    setupToken: env.SETUP_TOKEN,
  },
  webDist,
  logger: true,
})

await app.listen({ port, host })
