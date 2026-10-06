import { createHash } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type { FastifyInstance } from 'fastify'

// Backup de la base local del iPhone (el iPhone manda). Guarda cada fila tal cual, sin conocer el
// esquema de la app: tabla, id, updatedAt y el JSON completo. Nunca borra: los borrados de la app
// son suaves (deletedAt), así que llegan como una actualización más.

type BackupRow = { id: string; updatedAt: number; data: object }

const TABLE_NAME = /^[A-Za-z]{1,40}$/

/** Huella de una tabla: SHA-256 de las líneas "id:updatedAt" ordenadas. La app calcula la misma. */
export function tableHash(rows: { id: string; updatedAt: number }[]) {
  const lines = rows.map((row) => `${row.id}:${row.updatedAt}`).sort()
  return createHash('sha256').update(lines.join('\n')).digest('hex')
}

const isRow = (row: BackupRow) =>
  typeof row?.id === 'string' && Number.isFinite(row.updatedAt) && typeof row.data === 'object' && row.data !== null

export function registerBackupRoutes(app: FastifyInstance, db: DatabaseSync) {
  // Si el server ya tiene una versión más nueva de la fila, se queda con la suya.
  const upsert = db.prepare(`
    INSERT INTO backup_rows (tbl, id, updated_at, data) VALUES (?, ?, ?, ?)
    ON CONFLICT (tbl, id) DO UPDATE SET updated_at = excluded.updated_at, data = excluded.data
    WHERE excluded.updated_at >= backup_rows.updated_at
  `)

  // { tabla: huella }
  app.get('/api/backup/manifest', async () => {
    const rows = db.prepare('SELECT tbl, id, updated_at AS updatedAt FROM backup_rows').all() as {
      tbl: string
      id: string
      updatedAt: number
    }[]
    return Object.fromEntries([...Map.groupBy(rows, (row) => row.tbl)].map(([tbl, list]) => [tbl, tableHash(list)]))
  })

  // { id: updatedAt } de una tabla, para que la app suba solo lo que falta o cambió.
  app.get<{ Params: { tbl: string } }>('/api/backup/versions/:tbl', async (req) => {
    const rows = db.prepare('SELECT id, updated_at AS updatedAt FROM backup_rows WHERE tbl = ?').all(req.params.tbl) as {
      id: string
      updatedAt: number
    }[]
    return Object.fromEntries(rows.map((row) => [row.id, row.updatedAt]))
  })

  app.post<{ Body: { tbl: string; rows: BackupRow[] } }>('/api/backup/push', async (req, reply) => {
    const { tbl, rows } = req.body ?? {}
    if (typeof tbl !== 'string' || !TABLE_NAME.test(tbl) || !Array.isArray(rows) || !rows.every(isRow)) {
      return reply.code(400).send({ error: 'invalid_rows' })
    }
    db.exec('BEGIN')
    try {
      for (const row of rows) upsert.run(tbl, row.id, row.updatedAt, JSON.stringify(row.data))
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
    return { ok: true }
  })

  // Todo el backup para restaurar: { tabla: [fila, ...] }
  app.get('/api/backup/export', async () => {
    const rows = db.prepare('SELECT tbl, data FROM backup_rows').all() as { tbl: string; data: string }[]
    const tables: Record<string, object[]> = {}
    for (const row of rows) (tables[row.tbl] ??= []).push(JSON.parse(row.data))
    return tables
  })
}
