import { Fragment, useState } from 'react'
import { BlockTitle, Link, List, ListButton, ListItem, Page, Popup } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../../db/db'
import { Navbar } from '../../ui/Navbar'
import { TabPage } from '../../ui/TabPage'
import { AddFoodPopup } from './AddFoodPopup'
import { addDays, dateKey, deleteEntry, measuresOf, per100, sumNutrients, updateEntry } from './data'
import { DaySummary } from './DaySummary'
import { useDayEntries } from './hooks'
import { PortionForm } from './PortionForm'
import { MEALS, type FoodEntry, type Meal } from './types'

// Registro de comidas de un día: resumen frente a los objetivos y entradas por comida.
export function FoodPage() {
  const { t, i18n } = useTranslation()
  // "2 unidades medianas · 88 g" si se registró en una medida casera; si no, solo los gramos.
  const amountText = (entry: FoodEntry) => {
    const grams = `${entry.grams.toLocaleString(i18n.language)} g`
    if (!entry.unit || !entry.quantity) return grams
    return `${entry.quantity.toLocaleString(i18n.language)} ${t(`food.units.${entry.unit}`, { count: entry.quantity })} · ${grams}`
  }
  const today = dateKey(new Date())
  const [day, setDay] = useState(today)
  const entries = useDayEntries(day) ?? []
  const [adding, setAdding] = useState<{ opened: boolean; meal: Meal }>({ opened: false, meal: 'breakfast' })
  const [editing, setEditing] = useState<{ opened: boolean; entry?: FoodEntry }>({ opened: false })

  return (
    <TabPage>
      <Navbar title={t('tabs.food')} large transparent centerTitle />

      <DaySwitcher day={day} today={today} onChange={setDay} />
      <DaySummary eaten={sumNutrients(entries)} />

      {MEALS.map((meal) => {
        const items = entries.filter((e) => e.meal === meal)
        const kcal = Math.round(sumNutrients(items).kcal)
        return (
          <Fragment key={meal}>
            <BlockTitle className="justify-between">
              {t(`food.meals.${meal}`)}
              {kcal > 0 && <span className="text-[15px] font-normal tabular-nums text-label-2">{kcal} kcal</span>}
            </BlockTitle>
            <List strong inset dividers>
              {items.map((entry) => (
                <ListItem
                  key={entry.id}
                  link
                  title={entry.name}
                  subtitle={amountText(entry)}
                  after={<span className="tabular-nums">{Math.round(entry.kcal)} kcal</span>}
                  onClick={() => setEditing({ opened: true, entry })}
                />
              ))}
              <ListButton onClick={() => setAdding({ opened: true, meal })}>
                <Plus className="mr-1 h-5 w-5" />
                {t('food.addFood')}
              </ListButton>
            </List>
          </Fragment>
        )
      })}

      <AddFoodPopup {...adding} date={day} onClose={() => setAdding({ ...adding, opened: false })} />

      <Popup opened={editing.opened} onBackdropClick={() => setEditing({ ...editing, opened: false })}>
        <Page>
          <Navbar
            title={t('food.editEntry')}
            right={<Link onClick={() => setEditing({ ...editing, opened: false })}>{t('gym.close')}</Link>}
          />
          {editing.entry && (
            <EntryForm key={editing.entry.updatedAt} entry={editing.entry} onDone={() => setEditing({ ...editing, opened: false })} />
          )}
        </Page>
      </Popup>
    </TabPage>
  )
}

function EntryForm({ entry, onDone }: { entry: FoodEntry; onDone: () => void }) {
  const { t } = useTranslation()
  // Las medidas caseras vienen del alimento, si sigue guardado; la de la entrada se mantiene siempre.
  const food = useLiveQuery(async () => (entry.foodId ? ((await db.foods.get(entry.foodId)) ?? null) : null), [entry.foodId])
  if (food === undefined) return null
  const units = [...(food?.units ?? [])]
  const hasUnit = measuresOf({ servingGrams: food?.servingGrams, units }).some((m) => m.kind === entry.unit)
  if (entry.unit && entry.quantity && !hasUnit) units.push({ kind: entry.unit, grams: entry.grams / entry.quantity })

  return (
    <PortionForm
      food={{ ...per100(entry), name: entry.name, servingGrams: food?.servingGrams, units }}
      initial={{ grams: entry.grams, unit: entry.unit, quantity: entry.quantity }}
      initialMeal={entry.meal}
      submitLabel={t('food.save')}
      onSubmit={async (amount, meal) => {
        await updateEntry(entry, amount, meal)
        onDone()
      }}
      onDelete={async () => {
        await deleteEntry(entry.id)
        onDone()
      }}
    />
  )
}

// ‹ Hoy › para moverse entre días (no deja ir al futuro).
function DaySwitcher({ day, today, onChange }: { day: string; today: string; onChange: (day: string) => void }) {
  const { t, i18n } = useTranslation()
  const [y, m, d] = day.split('-').map(Number)
  const label =
    day === today
      ? t('food.today')
      : day === addDays(today, -1)
        ? t('food.yesterday')
        : new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
  const arrow = 'flex h-11 w-11 items-center justify-center rounded-full text-agenda active:bg-white/10 disabled:text-label-2/40'

  return (
    <div className="flex items-center justify-between px-2">
      <button className={arrow} aria-label="‹" onClick={() => onChange(addDays(day, -1))}>
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button className="text-[17px] font-semibold first-letter:uppercase" onClick={() => onChange(today)}>
        {label}
      </button>
      <button className={arrow} aria-label="›" disabled={day >= today} onClick={() => onChange(addDays(day, 1))}>
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  )
}
