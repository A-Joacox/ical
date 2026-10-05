import { DatabaseSync } from 'node:sqlite'

// SQLite integrado en Node 24 (sin dependencias nativas). `file` puede ser ':memory:' en tests.
export function openDb(file: string) {
  const db = new DatabaseSync(file)
  db.exec(`
    CREATE TABLE IF NOT EXISTS passkeys (
      id TEXT PRIMARY KEY,
      public_key BLOB NOT NULL,
      counter INTEGER NOT NULL,
      transports TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      keys TEXT NOT NULL,
      lang TEXT NOT NULL DEFAULT 'es',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  return db
}
