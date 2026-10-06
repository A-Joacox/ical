import { expect, test } from 'vitest'
import { tableHash } from './backup'

test('la huella es la misma que calcula el server (sin importar el orden)', async () => {
  // Mismo valor que en apps/server/src/backup.test.ts.
  const expected = '2bc11e86e8348c7c62f11e681435b5d013a262e5a9f3b8ce61c25831a516a45e'
  expect(await tableHash([{ id: 'b', updatedAt: 2 }, { id: 'a', updatedAt: 1 }])).toBe(expected)
})
