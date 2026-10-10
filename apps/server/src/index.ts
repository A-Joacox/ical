import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { alertMessage, evaluateAlerts, initialAlertState } from './alerts.ts'
import { buildApp } from './app.ts'
import { openDb } from './db.ts'
import { fetchServerStatus } from './glances.ts'
import { createPush } from './push.ts'

const env = process.env
const port = Number(env.PORT ?? 3000)
const host = env.HOST ?? '0.0.0.0'
const dataDir = env.DATA_DIR ?? fileURLToPath(new URL('../../../data', import.meta.url))
const webDist = env.WEB_DIST ?? fileURLToPath(new URL('../../web/dist', import.meta.url))
const origins = (env.ORIGIN ?? 'http://localhost:3000,http://localhost:5173').split(',')

if (env.NODE_ENV === 'production' && !env.SESSION_SECRET) {
  throw new Error('Falta SESSION_SECRET en apps/server/.env')
}

mkdirSync(dataDir, { recursive: true })
const db = openDb(join(dataDir, 'self-grow.db'))

const getStatus = env.GLANCES_URL ? () => fetchServerStatus(env.GLANCES_URL!) : undefined
const push =
  env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY
    ? createPush(db, {
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY,
        // Apple exige un `sub` válido (mailto: o https:); por defecto, el dominio de la app.
        subject: env.VAPID_SUBJECT ?? origins.find((o) => o.startsWith('https://')) ?? 'mailto:self-grow@localhost',
      })
    : undefined

const app = await buildApp({
  db,
  sessionSecret: env.SESSION_SECRET ?? 'dev-only-secret',
  auth: { rpID: env.RP_ID ?? 'localhost', origins, setupToken: env.SETUP_TOKEN },
  getStatus,
  push,
  usdaApiKey: env.USDA_API_KEY,
  calendarUrls: (env.CALENDAR_ICS_URLS ?? '').split(/[\s,]+/).filter(Boolean),
  gemini: env.GEMINI_API_KEY ? { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || 'gemini-flash-latest' } : undefined,
  webDist,
  logger: true,
})

await app.listen({ port, host })

// Revisa el server cada minuto y avisa por push si algo va mal.
if (getStatus && push) {
  let state = initialAlertState()
  setInterval(async () => {
    try {
      const result = evaluateAlerts(await getStatus(), state, Date.now())
      state = result.state
      for (const alert of result.alerts) await push.send((lang) => alertMessage(alert, lang))
    } catch (error) {
      app.log.warn({ error }, 'alert check failed')
    }
  }, 60_000)
}
