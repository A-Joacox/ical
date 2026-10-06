import { beforeEach, describe, expect, test } from 'vitest'
import { buildApp } from './app.ts'
import { tableHash } from './backup.ts'
import { openDb } from './db.ts'

let app: Awaited<ReturnType<typeof buildApp>>
let session: string

beforeEach(async () => {
  app = await buildApp({ db: openDb(':memory:'), sessionSecret: 'secreto', auth: { rpID: 'localhost', origins: [] } })
  session = app.signCookie(String(Date.now() + 60_000))
})

const get = async (url: string) => (await app.inject({ url, cookies: { sg_session: session } })).json()
const push = (tbl: string, rows: object[]) =>
  app.inject({ method: 'POST', url: '/api/backup/push', payload: { tbl, rows }, cookies: { sg_session: session } })
const row = (id: string, updatedAt: number, extra = {}) => ({ id, updatedAt, data: { id, updatedAt, ...extra } })

describe('backup', () => {
  test('requiere sesión', async () => {
    expect((await app.inject({ url: '/api/backup/manifest' })).statusCode).toBe(401)
  })

  test('la huella es la misma que calcula la app (sin importar el orden)', () => {
    // Mismo valor que en apps/web/src/db/backup.test.ts.
    const expected = '2bc11e86e8348c7c62f11e681435b5d013a262e5a9f3b8ce61c25831a516a45e'
    expect(tableHash([{ id: 'b', updatedAt: 2 }, { id: 'a', updatedAt: 1 }])).toBe(expected)
  })

  test('guarda filas, devuelve manifest, versiones y export', async () => {
    expect(await get('/api/backup/manifest')).toEqual({})
    expect((await push('workouts', [row('a', 1), row('b', 2, { name: 'Push' })])).statusCode).toBe(200)

    expect(await get('/api/backup/manifest')).toEqual({ workouts: tableHash([{ id: 'a', updatedAt: 1 }, { id: 'b', updatedAt: 2 }]) })
    expect(await get('/api/backup/versions/workouts')).toEqual({ a: 1, b: 2 })
    expect(await get('/api/backup/export')).toEqual({ workouts: [row('a', 1).data, row('b', 2, { name: 'Push' }).data] })
  })

  test('no pisa una versión más nueva', async () => {
    await push('settings', [row('goals', 10, { value: 'nuevo' })])
    await push('settings', [row('goals', 5, { value: 'viejo' })])
    expect(await get('/api/backup/export')).toEqual({ settings: [{ id: 'goals', updatedAt: 10, value: 'nuevo' }] })
  })

  test('rechaza tablas o filas inválidas sin guardar nada', async () => {
    expect((await push('../x', [row('a', 1)])).statusCode).toBe(400)
    expect((await push('workouts', [row('a', 1), { id: 'b', updatedAt: 'ayer', data: {} }])).statusCode).toBe(400)
    expect(await get('/api/backup/manifest')).toEqual({})
  })
})
