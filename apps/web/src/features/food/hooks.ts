import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { db } from '../../db/db'

/** Entradas de un día (sin borrar), en el orden en que se registraron. */
export const useDayEntries = (date: string) =>
  useLiveQuery(
    async () =>
      (await db.foodEntries.where('date').equals(date).toArray()).filter((e) => !e.deletedAt).sort((a, b) => a.createdAt - b.createdAt),
    [date],
  )

/** Nombre de un alimento en el idioma de la app (solo los precargados tienen nombre en inglés). */
export function useFoodName() {
  const { i18n } = useTranslation()
  return (food: { name: string; nameEn?: string }) => (i18n.resolvedLanguage === 'en' && food.nameEn) || food.name
}
