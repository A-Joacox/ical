import type { DatabaseSync } from 'node:sqlite'
import type { FastifyInstance } from 'fastify'
import webpush, { type PushSubscription } from 'web-push'

export type Lang = 'es' | 'en'
export type PushMessage = { title: string; body: string; tag?: string; url?: string }
export type VapidConfig = { publicKey: string; privateKey: string; subject: string }
type Sender = (subscription: PushSubscription, payload: string) => Promise<unknown>
type Row = { endpoint: string; keys: string; lang: Lang }

const MAX_REST_DELAY_MS = 60 * 60 * 1000

/** Suscripciones guardadas y envío de notificaciones. `sender` se puede reemplazar en tests. */
export function createPush(db: DatabaseSync, vapid: VapidConfig, sender?: Sender) {
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)
  // Alta urgencia y TTL corto: un aviso de descanso que llega tarde no sirve.
  const send: Sender = sender ?? ((subscription, payload) => webpush.sendNotification(subscription, payload, { urgency: 'high', TTL: 60 }))

  const list = () => db.prepare('SELECT endpoint, keys, lang FROM push_subscriptions').all() as unknown as Row[]
  const unsubscribe = (endpoint: string) => {
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint)
  }

  return {
    publicKey: vapid.publicKey,
    unsubscribe,

    subscribe(subscription: PushSubscription, lang: Lang) {
      db.prepare(
        `INSERT INTO push_subscriptions (endpoint, keys, lang) VALUES (?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET keys = excluded.keys, lang = excluded.lang`,
      ).run(subscription.endpoint, JSON.stringify(subscription.keys), lang)
    },

    /** Envía a todas las suscripciones; el mensaje se arma en el idioma de cada una. */
    async send(message: (lang: Lang) => PushMessage) {
      await Promise.all(
        list().map(async (row) => {
          try {
            await send({ endpoint: row.endpoint, keys: JSON.parse(row.keys) }, JSON.stringify(message(row.lang)))
          } catch (error) {
            // 404/410: la suscripción ya no existe (app borrada o permiso revocado).
            const status = (error as { statusCode?: number }).statusCode
            if (status === 404 || status === 410) unsubscribe(row.endpoint)
          }
        }),
      )
    },
  }
}

export type Push = ReturnType<typeof createPush>

export function registerPushRoutes(app: FastifyInstance, push: Push) {
  // Un solo usuario: como mucho un descanso pendiente.
  let restTimer: NodeJS.Timeout | undefined
  const cancelRest = () => clearTimeout(restTimer)

  app.get('/api/push/key', async () => ({ publicKey: push.publicKey }))

  app.post<{ Body: { subscription: PushSubscription; lang?: Lang } }>('/api/push/subscribe', async (req, reply) => {
    const { subscription, lang } = req.body ?? {}
    if (!subscription?.endpoint || !subscription.keys) return reply.code(400).send({ error: 'invalid_subscription' })
    push.subscribe(subscription, lang === 'en' ? 'en' : 'es')
    return { ok: true }
  })

  app.post<{ Body: { endpoint: string } }>('/api/push/unsubscribe', async (req) => {
    if (req.body?.endpoint) push.unsubscribe(req.body.endpoint)
    return { ok: true }
  })

  app.post<{ Body: { title: string; body: string } }>('/api/push/test', async (req) => {
    await push.send(() => ({ title: req.body?.title ?? 'Self Grow', body: req.body?.body ?? '', tag: 'test' }))
    return { ok: true }
  })

  // Aviso de fin de descanso para cuando el iPhone está bloqueado. Se pide con el tiempo
  // restante (no una hora absoluta) para no depender de que los relojes coincidan.
  app.post<{ Body: { delaySeconds: number; title: string; body: string } }>('/api/push/timer', async (req, reply) => {
    const { delaySeconds, title, body } = req.body ?? {}
    const delay = Number(delaySeconds) * 1000
    if (!(delay > 0 && delay <= MAX_REST_DELAY_MS) || !title) return reply.code(400).send({ error: 'invalid_timer' })
    cancelRest()
    restTimer = setTimeout(() => push.send(() => ({ title, body, tag: 'rest', url: '/gym/session' })), delay)
    return { ok: true }
  })

  app.post('/api/push/timer/cancel', async () => {
    cancelRest()
    return { ok: true }
  })

  app.addHook('onClose', async () => cancelRest())
}
