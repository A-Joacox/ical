import { useState } from 'react'
import { Block, BlockFooter, BlockTitle, Button, Link, List, ListItem, Preloader } from 'konsta/react'
import { Camera, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PhotoItem } from './api'
import { scaleNutrients, sumNutrients } from './data'
import { MealPicker } from './MealPicker'
import { NutrientGrid } from './NutrientGrid'
import { parseGrams } from './RecipeForm'
import type { Meal, Nutrients } from './types'

/** Lo reconocido, en revisión: valores por 100 g (de la estimación) y gramos como texto editable. */
export type PhotoDraft = { name: string; per100: Nutrients; grams: string; confidence: PhotoItem['confidence'] }

export const toDraft = (item: PhotoItem): PhotoDraft => ({
  name: item.name,
  per100: scaleNutrients(item, 100 / item.grams),
  grams: String(item.grams),
  confidence: item.confidence,
})

const CONFIDENCE_DOT = { high: 'bg-food', medium: 'bg-warning', low: 'bg-danger' } as const

type Props = {
  preview: string
  /** undefined mientras Gemini analiza. */
  items?: PhotoDraft[]
  error?: string
  meal: Meal
  onChange: (items: PhotoDraft[]) => void
  onRetake: () => void
  onAdd: (items: (Nutrients & { name: string; grams: number })[], meal: Meal) => void
}

// Resultado de la foto: lo que reconoció Gemini, con gramos corregibles, antes de guardarlo.
export function PhotoView({ preview, items, error, meal: initialMeal, onChange, onRetake, onAdd }: Props) {
  const { t } = useTranslation()
  const [meal, setMeal] = useState(initialMeal)
  const reviewed = (items ?? []).map((item) => {
    const grams = parseGrams(item.grams) ?? 0
    return { name: item.name, grams, ...scaleNutrients(item.per100, grams / 100) }
  })
  const total = sumNutrients(reviewed)
  const valid = reviewed.length > 0 && reviewed.every((item) => item.grams > 0)

  const retake = (
    <Button large rounded tonal onClick={onRetake}>
      <Camera className="mr-1.5 h-5 w-5" />
      {t('food.retake')}
    </Button>
  )

  return (
    <>
      {preview && (
        <Block className="flex justify-center">
          <img src={preview} alt="" className="max-h-56 rounded-2xl" />
        </Block>
      )}

      {error ? (
        <Block className="space-y-4 text-center text-[15px] text-label-2">
          <p>{error}</p>
          {retake}
        </Block>
      ) : !items ? (
        <Block className="space-y-3 text-center text-[15px] text-label-2">
          <Preloader />
          <p>{t('food.analyzing')}</p>
        </Block>
      ) : !items.length ? (
        <Block className="space-y-4 text-center text-[15px] text-label-2">
          <p>{t('food.photoNone')}</p>
          {retake}
        </Block>
      ) : (
        <>
          <BlockTitle className="justify-between">
            {t('food.photoFound')}
            <span className="text-[15px] font-normal tabular-nums text-label-2">{Math.round(total.kcal)} kcal</span>
          </BlockTitle>
          <List strong inset dividers>
            {items.map((item, index) => (
              <ListItem
                key={index}
                title={item.name}
                subtitle={
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${CONFIDENCE_DOT[item.confidence]}`} />
                    {Math.round(reviewed[index].kcal)} kcal · {t(`food.confidence.${item.confidence}`)}
                  </span>
                }
                after={
                  <span className="flex items-center gap-1.5">
                    <input
                      inputMode="decimal"
                      aria-label={t('food.grams')}
                      value={item.grams}
                      onChange={(event) => onChange(items.map((it, i) => (i === index ? { ...it, grams: event.target.value } : it)))}
                      className="h-9 w-20 rounded-lg bg-surface-2 text-center text-[17px] tabular-nums text-white outline-none"
                    />
                    g
                    <Link iconOnly aria-label={t('food.remove')} onClick={() => onChange(items.filter((_, i) => i !== index))}>
                      <X className="h-5 w-5" />
                    </Link>
                  </span>
                }
              />
            ))}
          </List>
          <BlockFooter inset>{t('food.photoHint')}</BlockFooter>

          <Block strong inset>
            <NutrientGrid values={total} />
          </Block>

          <MealPicker meal={meal} onChange={setMeal} />

          <Block className="space-y-3">
            <Button large rounded disabled={!valid} onClick={() => onAdd(reviewed, meal)}>
              {t('food.addAll', { meal: t(`food.meals.${meal}`) })}
            </Button>
            <Button large rounded clear onClick={onRetake}>
              {t('food.retake')}
            </Button>
          </Block>
        </>
      )}

      <BlockFooter inset>{t('food.photoPrivacy')}</BlockFooter>
    </>
  )
}
