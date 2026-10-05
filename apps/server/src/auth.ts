import { timingSafeEqual } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
  type WebAuthnCredential,
} from '@simplewebauthn/server'

export type AuthConfig = {
  rpID: string
  origins: string[]
  /** Permite registrar la primera passkey. Sin él, solo una sesión activa puede añadir dispositivos. */
  setupToken?: string
}

type Purpose = 'register' | 'login'
type PasskeyRow = { id: string; public_key: Uint8Array<ArrayBuffer>; counter: number; transports: string }

const SESSION_COOKIE = 'sg_session'
const CHALLENGE_COOKIE = 'sg_challenge'
const SESSION_SECONDS = 180 * 24 * 60 * 60
const CHALLENGE_SECONDS = 5 * 60
const USER_ID = new TextEncoder().encode('self-grow-owner')
const cookieBase = { path: '/', httpOnly: true, secure: true, sameSite: 'strict', signed: true } as const
const limited = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }

// Login con passkey (Face ID) para un único usuario. La sesión es una cookie firmada con su
// fecha de expiración; el challenge viaja en otra cookie firmada ligada a su propósito.
export function registerAuth(app: FastifyInstance, db: DatabaseSync, config: AuthConfig) {
  const toCredential = (row: PasskeyRow): WebAuthnCredential => ({
    id: row.id,
    publicKey: row.public_key,
    counter: row.counter,
    transports: JSON.parse(row.transports),
  })
  const listPasskeys = () => (db.prepare('SELECT * FROM passkeys').all() as unknown as PasskeyRow[]).map(toCredential)
  const findPasskey = (id: unknown) => {
    const row = typeof id === 'string' ? db.prepare('SELECT * FROM passkeys WHERE id = ?').get(id) : undefined
    return row ? toCredential(row as unknown as PasskeyRow) : undefined
  }

  const hasSession = (req: FastifyRequest) => {
    const raw = req.cookies[SESSION_COOKIE]
    if (!raw) return false
    const { valid, value } = req.unsignCookie(raw)
    return valid && Number(value) > Date.now()
  }
  const startSession = (reply: FastifyReply) => {
    reply.setCookie(SESSION_COOKIE, String(Date.now() + SESSION_SECONDS * 1000), { ...cookieBase, maxAge: SESSION_SECONDS })
  }
  const setChallenge = (reply: FastifyReply, purpose: Purpose, challenge: string) => {
    const expires = Date.now() + CHALLENGE_SECONDS * 1000
    reply.setCookie(CHALLENGE_COOKIE, `${purpose}:${expires}:${challenge}`, { ...cookieBase, maxAge: CHALLENGE_SECONDS })
  }
  // Devuelve el challenge solo si es del propósito esperado y no expiró; siempre lo consume.
  const takeChallenge = (req: FastifyRequest, reply: FastifyReply, purpose: Purpose) => {
    const raw = req.cookies[CHALLENGE_COOKIE]
    reply.clearCookie(CHALLENGE_COOKIE, { path: '/' })
    if (!raw) return undefined
    const { valid, value } = req.unsignCookie(raw)
    const [cookiePurpose, expires, challenge] = valid && value ? value.split(':') : []
    if (cookiePurpose !== purpose || Number(expires) < Date.now()) return undefined
    return challenge
  }
  const validSetupToken = (token: unknown) => {
    if (!config.setupToken || typeof token !== 'string') return false
    const a = Buffer.from(token)
    const b = Buffer.from(config.setupToken)
    return a.length === b.length && timingSafeEqual(a, b)
  }

  // Toda la /api requiere sesión, salvo health y los endpoints de login.
  app.addHook('onRequest', async (req, reply) => {
    const path = req.url.split('?', 1)[0]
    if (!path.startsWith('/api/') || path === '/api/health' || path.startsWith('/api/auth/')) return
    if (!hasSession(req)) return reply.code(401).send({ error: 'unauthorized' })
  })

  app.get('/api/auth/status', async (req) => ({
    authenticated: hasSession(req),
    registered: listPasskeys().length > 0,
  }))

  app.post<{ Body: { setupToken?: string } | undefined }>('/api/auth/register/options', limited, async (req, reply) => {
    if (!hasSession(req) && !validSetupToken(req.body?.setupToken)) {
      return reply.code(403).send({ error: 'forbidden' })
    }
    const options = await generateRegistrationOptions({
      rpName: 'Self Grow',
      rpID: config.rpID,
      userName: 'self-grow',
      userDisplayName: 'Self Grow',
      userID: USER_ID,
      attestationType: 'none',
      excludeCredentials: listPasskeys().map(({ id, transports }) => ({ id, transports })),
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    })
    setChallenge(reply, 'register', options.challenge)
    return options
  })

  app.post<{ Body: RegistrationResponseJSON }>('/api/auth/register/verify', limited, async (req, reply) => {
    const challenge = takeChallenge(req, reply, 'register')
    if (!challenge) return reply.code(400).send({ error: 'invalid_challenge' })
    try {
      const { verified, registrationInfo } = await verifyRegistrationResponse({
        response: req.body,
        expectedChallenge: challenge,
        expectedOrigin: config.origins,
        expectedRPID: config.rpID,
        requireUserVerification: true,
      })
      if (!verified) return reply.code(400).send({ error: 'not_verified' })
      const { id, publicKey, counter, transports } = registrationInfo.credential
      db.prepare('INSERT INTO passkeys (id, public_key, counter, transports) VALUES (?, ?, ?, ?)').run(
        id,
        publicKey,
        counter,
        JSON.stringify(transports ?? []),
      )
    } catch (error) {
      req.log.warn({ error }, 'passkey registration failed')
      return reply.code(400).send({ error: 'not_verified' })
    }
    startSession(reply)
    return { ok: true }
  })

  app.post('/api/auth/login/options', limited, async (_req, reply) => {
    const options = await generateAuthenticationOptions({ rpID: config.rpID, userVerification: 'required' })
    setChallenge(reply, 'login', options.challenge)
    return options
  })

  app.post<{ Body: AuthenticationResponseJSON }>('/api/auth/login/verify', limited, async (req, reply) => {
    const challenge = takeChallenge(req, reply, 'login')
    const credential = findPasskey(req.body?.id)
    if (!challenge || !credential) return reply.code(400).send({ error: 'not_verified' })
    try {
      const { verified, authenticationInfo } = await verifyAuthenticationResponse({
        response: req.body,
        expectedChallenge: challenge,
        expectedOrigin: config.origins,
        expectedRPID: config.rpID,
        credential,
        requireUserVerification: true,
      })
      if (!verified) return reply.code(400).send({ error: 'not_verified' })
      db.prepare('UPDATE passkeys SET counter = ? WHERE id = ?').run(authenticationInfo.newCounter, credential.id)
    } catch (error) {
      req.log.warn({ error }, 'passkey login failed')
      return reply.code(400).send({ error: 'not_verified' })
    }
    startSession(reply)
    return { ok: true }
  })

  app.post('/api/auth/logout', async (_req, reply) => {
    reply.clearCookie(SESSION_COOKIE, { path: '/' })
    return { ok: true }
  })
}
