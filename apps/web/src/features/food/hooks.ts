import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'

/** Entradas de un día (sin borrar), en el orden en que se registraron. */
export const useDayEntries = (date: string) =>
  useLiveQuery(
    async () =>
      (await db.foodEntries.where('date').equals(date).toArray()).filter((e) => !e.deletedAt).sort((a, b) => a.createdAt - b.createdAt),
    [date],
  )
