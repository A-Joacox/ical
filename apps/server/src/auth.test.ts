import { beforeEach, describe, expect, test } from 'vitest'
import { buildApp } from './app.ts'
import { openDb } from './db.ts'

const SETUP_TOKEN = 'setup-token-de-prueba'

let app: Awaited<ReturnType<typeof buildApp>>

beforeEach(async () => {
  app = await buildApp({
    db: openDb(':memory:'),
    sessionSecret: 'secreto-de-prueba',
    auth: { rpID: 'localhost', origins: ['http://localhost:3000'], setupToken: SETUP_TOKEN },
  })
})

const cookie = (res: { cookies: { name: string; value: string }[] }, name: string) =>
  res.cookies.find((c) => c.name === name)?.value

describe('auth', () => {
  test('health es público', async () => {
    const res = await app.inject({ url: '/api/health' })
    expect(res.statusCode).toBe(200)
  })

  test('el resto de la /api exige sesión', async () => {
    const res = await app.inject({ url: '/api/backup/manifest' })
    expect(res.statusCode).toBe(401)
  })

  test('status sin passkeys ni sesión', async () => {
    const res = await app.inject({ url: '/api/auth/status' })
    expect(res.json()).toEqual({ authenticated: false, registered: false })
  })

  test('registrar requiere el setup token', async () => {
    const bad = await app.inject({ method: 'POST', url: '/api/auth/register/options', payload: { setupToken: 'x' } })
    expect(bad.statusCode).toBe(403)

    const ok = await app.inject({ method: 'POST', url: '/api/auth/register/options', payload: { setupToken: SETUP_TOKEN } })
    expect(ok.statusCode).toBe(200)
    expect(ok.json().rp.id).toBe('localhost')
    expect(cookie(ok, 'sg_challenge')).toBeDefined()
  })

  test('un challenge de login no sirve para registrar', async () => {
    const options = await app.inject({ method: 'POST', url: '/api/auth/login/options' })
    const challenge = cookie(options, 'sg_challenge')!
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register/verify',
      cookies: { sg_challenge: challenge },
      payload: {},
    })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toEqual({ error: 'invalid_challenge' })
  })

  test('una cookie de sesión falsificada no da acceso', async () => {
    const future = String(Date.now() + 60_000)
    const res = await app.inject({ url: '/api/backup/manifest', cookies: { sg_session: future } })
    expect(res.statusCode).toBe(401)
  })
})
