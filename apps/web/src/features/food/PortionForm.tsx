import { useState } from 'react'
import { Block, BlockTitle, Button, Segmented, SegmentedButton } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { SEGMENTED_COLORS } from '../../ui/segmented'
import { scaleNutrients } from './data'
import { NutrientGrid } from './NutrientGrid'
import { MEALS, type Meal, type Nutrients } from './types'

type Props = {
  /** Valores por 100 g. */
  food: Nutrients & { name: string; brand?: string; servingGrams?: number }
  initialGrams: number
  initialMeal: Meal
  submitLabel: string
  onSubmit: (grams: number, meal: Meal) => void
  /** Corregir el alimento o el plato (sus valores, no esta cantidad). */
  onEdit?: () => void
  onDelete?: () => void
}

// Cantidad y comida de un alimento, con los nutrientes calculados al momento.
export function PortionForm({ food, initialGrams, initialMeal, submitLabel, onSubmit, onEdit, onDelete }: Props) {
  const { t } = useTranslation()
  const [gramsText, setGramsText] = useState(String(initialGrams))
  const [meal, setMeal] = useState(initialMeal)
  const grams = Number(gramsText.replace(',', '.'))
  const valid = grams > 0
  const total = scaleNutrients(food, valid ? grams / 100 : 0)

  const presets = [
    ...(food.servingGrams ? [{ label: t('food.serving', { grams: food.servingGrams }), grams: food.servingGrams }] : []),
    ...(food.servingGrams !== 100 ? [{ label: '100 g', grams: 100 }] : []),
  ]

  return (
    <>
      <Block className="text-center">
        <h2 className="text-[22px] font-bold leading-tight">{food.name}</h2>
        {food.brand && <p className="mt-1 text-[15px] text-label-2">{food.brand}</p>}
      </Block>

      <Block strong inset className="space-y-4">
        <label className="flex items-baseline justify-center gap-2">
          <input
            inputMode="decimal"
            value={gramsText}
            onChange={(event) => setGramsText(event.target.value)}
            className="w-36 rounded-xl bg-surface-2 py-1 text-center text-[34px] font-bold tabular-nums outline-none"
          />
          <span className="text-[22px] text-label-2">g</span>
        </label>
        <div className="flex justify-center gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              className="rounded-full bg-surface-2 px-3 py-1.5 text-[15px] active:bg-separator"
              onClick={() => setGramsText(String(preset.grams))}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <NutrientGrid values={total} />
      </Block>

      <BlockTitle>{t('food.meal')}</BlockTitle>
      <Block>
        <Segmented strong colors={SEGMENTED_COLORS}>
          {MEALS.map((value) => (
            <SegmentedButton key={value} active={meal === value} className="text-white" onClick={() => setMeal(value)}>
              {t(`food.meals.${value}`)}
            </SegmentedButton>
          ))}
        </Segmented>
      </Block>

      <Block className="space-y-3">
        <Button large rounded disabled={!valid} onClick={() => onSubmit(grams, meal)}>
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
