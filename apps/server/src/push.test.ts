import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import webpush from 'web-push'
import { buildApp } from './app.ts'
import { openDb } from './db.ts'
import { createPush } from './push.ts'

const VAPID = { ...webpush.generateVAPIDKeys(), subject: 'https://example.ts.net' }
const SUBSCRIPTION = { endpoint: 'https://push.example/abc', keys: { p256dh: 'key', auth: 'auth' } }

let sent: { endpoint: string; payload: Record<string, string> }[]
let app: Awaited<ReturnType<typeof buildApp>>
let session: string

beforeEach(async () => {
  sent = []
  const db = openDb(':memory:')
  const push = createPush(db, VAPID, async (subscription, payload) => {
    sent.push({ endpoint: subscription.endpoint, payload: JSON.parse(payload) })
  })
  app = await buildApp({ db, push, sessionSecret: 'secreto', auth: { rpID: 'localhost', origins: [] } })
  // Sesión válida firmada con el mismo secreto, sin pasar por la passkey.
  session = app.signCookie(String(Date.now() + 60_000))
})

afterEach(() => vi.useRealTimers())

const post = (url: string, payload: object) => app.inject({ method: 'POST', url, payload, cookies: { sg_session: session } })

describe('push', () => {
  test('requiere sesión', async () => {
    const res = await app.inject({ url: '/api/push/key' })
    expect(res.statusCode).toBe(401)
  })

  test('suscribirse y recibir una prueba en su idioma', async () => {
    expect((await post('/api/push/subscribe', { subscription: SUBSCRIPTION, lang: 'en' })).statusCode).toBe(200)
    await post('/api/push/test', { title: 'Hola', body: 'Prueba' })
    expect(sent).toEqual([{ endpoint: SUBSCRIPTION.endpoint, payload: { title: 'Hola', body: 'Prueba', tag: 'test' } }])
  })

  test('el aviso de descanso se envía al terminar y se puede cancelar', async () => {
    // Solo setTimeout: Fastify usa setImmediate para responder a inject().
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await post('/api/push/subscribe', { subscription: SUBSCRIPTION })
    await post('/api/push/timer', { delaySeconds: 90, title: 'Descanso terminado', body: 'Siguiente serie' })
    await vi.advanceTimersByTimeAsync(89_000)
    expect(sent).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(sent[0].payload).toMatchObject({ title: 'Descanso terminado', tag: 'rest', url: '/gym/session' })

    await post('/api/push/timer', { delaySeconds: 60, title: 'Otro', body: '' })
    await post('/api/push/timer/cancel', {})
    await vi.advanceTimersByTimeAsync(120_000)
    expect(sent).toHaveLength(1)
  })

  test('borra suscripciones caducadas (410)', async () => {
    const db = openDb(':memory:')
    const push = createPush(db, VAPID, async () => {
      throw Object.assign(new Error('gone'), { statusCode: 410 })
    })
    push.subscribe(SUBSCRIPTION, 'es')
    await push.send(() => ({ title: 'x', body: 'y' }))
    expect(db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').get()).toEqual({ n: 0 })
  })
})
