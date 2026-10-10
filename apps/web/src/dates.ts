/** Día local como "AAAA-MM-DD". */
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** "AAAA-MM-DD" → medianoche local de ese día. */
export function fromDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (key: string, days: number) => {
  const date = fromDateKey(key)
  date.setDate(date.getDate() + days)
  return dateKey(date)
}

/** Lunes de la semana del día. */
export const startOfWeek = (key: string) => addDays(key, -((fromDateKey(key).getDay() + 6) % 7))
