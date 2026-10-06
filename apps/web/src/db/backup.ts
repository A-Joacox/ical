import type { Table } from 'dexie'
import { api } from '../api'
import { db } from './db'

// Backup en el server (el iPhone manda). Al abrir la app o volver a ella, como mucho cada 15 min,
// compara la huella de cada tabla con la del server y sube solo las filas que faltan o cambiaron.

type AnyRow = { updatedAt: number } & Record<string, unknown>

const CHECK_EVERY_MS = 15 * 60 * 1000
// Filas por petición, para no pasar el límite de 1 MB del body.
const BATCH = 500
const STORAGE_KEY = 'backupAt'

// La clave primaria de casi todas las tablas es `id`; la de ajustes es `key`.
const keyOf = (table: Table, row: AnyRow) => String(row[table.schema.primKey.keyPath as string])

/** Misma huella que calcula el server: SHA-256 de las líneas "id:updatedAt" ordenadas. */
export async function tableHash(rows: { id: string; updatedAt: number }[]) {
  const lines = rows.map((row) => `${row.id}:${row.updatedAt}`).sort()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(lines.join('\n')))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Cuándo se comprobó por última vez que el server tiene todo. */
export const lastBackupAt = () => Number(localStorage.getItem(STORAGE_KEY)) || undefined

async function backup() {
  const manifest = await api<Record<string, string>>('/backup/manifest')
  for (const table of db.tables) {
    const rows = (await table.toArray()) as AnyRow[]
    const versions = rows.map((row) => ({ id: keyOf(table, row), updatedAt: row.updatedAt }))
    if (manifest[table.name] === (await tableHash(versions))) continue

    const stored = manifest[table.name] ? await api<Record<string, number>>(`/backup/versions/${table.name}`) : {}
    const changed = rows.filter((row, i) => (stored[versions[i].id] ?? -1) < row.updatedAt)
    for (let i = 0; i < changed.length; i += BATCH) {
      const batch = changed.slice(i, i + BATCH).map((row) => ({ id: keyOf(table, row), updatedAt: row.updatedAt, data: row }))
      await api('/backup/push', { tbl: table.name, rows: batch })
    }
  }
  const now = Date.now()
  localStorage.setItem(STORAGE_KEY, String(now))
  return now
}

let running: Promise<number> | undefined

/** Sube lo que falte y devuelve la hora del backup. Falla sin conexión o sin sesión. */
export function backupNow() {
  running ??= backup().finally(() => (running = undefined))
  return running
}

/** Backup automático al abrir la app y al volver a ella. Si falla, se reintenta la próxima vez. */
export function startAutoBackup() {
  const check = () => {
    if (document.visibilityState === 'visible' && Date.now() - (lastBackupAt() ?? 0) > CHECK_EVERY_MS) {
      backupNow().catch(() => {})
    }
  }
  check()
  document.addEventListener('visibilitychange', check)
}

/** Trae el backup del server y lo mezcla con lo local: por cada fila gana la versión más nueva. */
export async function restoreBackup() {
  const tables = await api<Record<string, AnyRow[]>>('/backup/export')
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      const local = new Map(((await table.toArray()) as AnyRow[]).map((row) => [keyOf(table, row), row.updatedAt]))
      const newer = (tables[table.name] ?? []).filter((row) => (local.get(keyOf(table, row)) ?? -1) < row.updatedAt)
      await table.bulkPut(newer)
    }
  })
}
