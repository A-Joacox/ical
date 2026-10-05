import Dexie, { type EntityTable } from 'dexie'

// Base de datos local (IndexedDB). Cada módulo añade sus tablas con una nueva db.version().
export type Setting = { key: string; value: unknown; updatedAt: number }

export const db = new Dexie('self-grow') as Dexie & {
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  settings: 'key',
})
