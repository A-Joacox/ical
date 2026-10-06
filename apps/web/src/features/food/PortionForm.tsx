import { useState } from 'react'
import { Block, Button } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { measuresOf, scaleNutrients, type Amount } from './data'
import { useFoodName } from './hooks'
import { MealPicker } from './MealPicker'
import { NutrientGrid } from './NutrientGrid'
import type { FoodUnit, Meal, Nutrients, UnitKind } from './types'

type Props = {
  /** Valores por 100 g y medidas caseras. */
  food: Nutrients & { name: string; nameEn?: string; brand?: string; servingGrams?: number; units?: FoodUnit[] }
  initial: Amount
  initialMeal: Meal
  submitLabel: string
  onSubmit: (amount: Amount, meal: Meal) => void
  /** Corregir el alimento o el plato (sus valores, no esta cantidad). */
  onEdit?: () => void
  onDelete?: () => void
}

// Cantidad (en gramos o en una medida casera) y comida, con los nutrientes calculados al momento.
export function PortionForm({ food, initial, initialMeal, submitLabel, onSubmit, onEdit, onDelete }: Props) {
  const { t, i18n } = useTranslation()
  const foodName = useFoodName()
  const measures = measuresOf(food)
  const initialMeasure = measures.find((m) => m.kind === initial.unit)
  const [unit, setUnit] = useState<UnitKind | 'g'>(initialMeasure?.kind ?? 'g')
  const [quantityText, setQuantityText] = useState(String(initialMeasure ? (initial.quantity ?? 1) : initial.grams))
  const [meal, setMeal] = useState(initialMeal)

  const quantity = Number(quantityText.replace(',', '.'))
  const valid = quantity > 0
  const measure = measures.find((m) => m.kind === unit)
  const grams = Math.round((measure ? quantity * measure.grams : quantity) * 10) / 10
  const total = scaleNutrients(food, valid ? grams / 100 : 0)
  const amount: Amount = measure ? { grams, unit: measure.kind, quantity } : { grams }
  const number = (n: number) => n.toLocaleString(i18n.language)

  // Al cambiar de medida: a gramos se pasan los gramos actuales; a una medida, 1.
  const choose = (next: UnitKind | 'g') => {
    if (next === unit) return
    setQuantityText(next === 'g' ? String(valid ? grams : 100) : '1')
    setUnit(next)
  }

  return (
    <>
      <Block className="text-center">
        <h2 className="text-[22px] font-bold leading-tight">{foodName(food)}</h2>
        {food.brand && <p className="mt-1 text-[15px] text-label-2">{food.brand}</p>}
      </Block>

      <Block strong inset className="space-y-4">
        <label className="flex items-baseline justify-center gap-2">
          <input
            inputMode="decimal"
            value={quantityText}
            onChange={(event) => setQuantityText(event.target.value)}
            className="w-28 rounded-xl bg-surface-2 py-1 text-center text-[34px] font-bold tabular-nums outline-none"
          />
          <span className="text-[20px] text-label-2">{measure ? t(`food.units.${measure.kind}`, { count: quantity || 1 }) : 'g'}</span>
        </label>
        {measure && <p className="-mt-2 text-center text-[15px] tabular-nums text-label-2">= {number(grams)} g</p>}
        {measures.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {[...measures, { kind: 'g' as const, grams: 1 }].map((m) => (
              <button
                key={m.kind}
                className={`rounded-full px-3 py-1.5 text-[15px] ${unit === m.kind ? 'bg-agenda text-white' : 'bg-surface-2 active:bg-separator'}`}
                onClick={() => choose(m.kind)}
              >
                {m.kind === 'g' ? t('food.grams') : `${t(`food.units.${m.kind}`, { count: 1 })} · ${number(m.grams)} g`}
              </button>
            ))}
          </div>
        )}
        <NutrientGrid values={total} />
      </Block>

      <MealPicker meal={meal} onChange={setMeal} />

      <Block className="space-y-3">
        <Button large rounded disabled={!valid} onClick={() => onSubmit(amount, meal)}>
          {submitLabel}
        </Button>
        {onEdit && (
          <Button large rounded clear onClick={onEdit}>
            {t('food.edit')}
          </Button>
        )}
        {onDelete && (
          <Button large rounded clear colors={{ textIos: 'text-danger' }} onClick={onDelete}>
            {t('food.delete')}
          </Button>
        )}
      </Block>
    </>
  )
}
