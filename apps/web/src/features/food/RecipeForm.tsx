import { Block, BlockFooter, BlockTitle, Button, Link, List, ListButton, ListInput, ListItem } from 'konsta/react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { recipeValues, scaleNutrients, sumNutrients } from './data'
import { NutrientGrid } from './NutrientGrid'
import type { Food } from './types'

/** Plato en edición. Los gramos van como texto para poder borrarlos y reescribirlos. */
export type RecipeDraft = { id?: string; name: string; items: { food: Food; grams: string }[]; cookedGrams: string }

/** Gramos escritos (acepta coma decimal); undefined si no es un número positivo. */
export function parseGrams(text: string) {
  const value = Number(text.replace(',', '.'))
  return value > 0 ? value : undefined
}

type Props = {
  draft: RecipeDraft
  onChange: (draft: RecipeDraft) => void
  onAddIngredient: () => void
  onSave: () => void
  onDelete?: () => void
}

// Plato casero: ingredientes con sus gramos y, si se cocinó en cantidad, el peso final.
export function RecipeForm({ draft, onChange, onAddIngredient, onSave, onDelete }: Props) {
  const { t } = useTranslation()
  const items = draft.items.map((item) => ({ food: item.food, grams: parseGrams(item.grams) ?? 0 }))
  const cookedGrams = parseGrams(draft.cookedGrams)
  const rawGrams = items.reduce((sum, item) => sum + item.grams, 0)
  const total = sumNutrients(items.map((item) => scaleNutrients(item.food, item.grams / 100)))
  const valid = !!draft.name.trim() && items.length > 0 && items.every((item) => item.grams > 0)

  const setGrams = (index: number, grams: string) =>
    onChange({ ...draft, items: draft.items.map((item, i) => (i === index ? { ...item, grams } : item)) })
  const remove = (index: number) => onChange({ ...draft, items: draft.items.filter((_, i) => i !== index) })

  return (
    <>
      <List strong inset>
        <ListInput label={t('food.dishName')} value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
      </List>

      <BlockTitle>{t('food.ingredients')}</BlockTitle>
      <List strong inset dividers>
        {draft.items.map((item, index) => (
          <ListItem
            key={`${item.food.id}-${index}`}
            title={item.food.name}
            subtitle={`${Math.round(scaleNutrients(item.food, items[index].grams / 100).kcal)} kcal`}
            after={
              <span className="flex items-center gap-1.5">
                <input
                  inputMode="decimal"
                  aria-label={t('food.grams')}
                  value={item.grams}
                  onChange={(event) => setGrams(index, event.target.value)}
                  className="h-9 w-20 rounded-lg bg-surface-2 text-center text-[17px] tabular-nums text-white outline-none"
                />
                g
                <Link iconOnly aria-label={t('food.removeIngredient')} onClick={() => remove(index)}>
                  <X className="h-5 w-5" />
                </Link>
              </span>
            }
          />
        ))}
        <ListButton onClick={onAddIngredient}>
          <Plus className="mr-1 h-5 w-5" />
          {t('food.addIngredient')}
        </ListButton>
      </List>
      <BlockFooter inset>{t('food.ingredientsHint')}</BlockFooter>

      <List strong inset>
        <ListInput
          label={t('food.cookedGrams')}
          inputMode="decimal"
          placeholder={rawGrams ? String(rawGrams) : ''}
          value={draft.cookedGrams}
          onChange={(event) => onChange({ ...draft, cookedGrams: event.target.value })}
        />
      </List>
      <BlockFooter inset>{t('food.cookedHint')}</BlockFooter>

      {items.length > 0 && (
        <>
          <BlockTitle className="justify-between">
            {t('food.dishTotal')}
            <span className="text-[15px] font-normal tabular-nums text-label-2">
              {Math.round(cookedGrams ?? rawGrams)} g · {Math.round(total.kcal)} kcal
            </span>
          </BlockTitle>
          <Block strong inset className="space-y-2">
            <div className="text-center text-[13px] text-label-2">{t('food.per100')}</div>
            <NutrientGrid values={recipeValues(items, cookedGrams)} />
          </Block>
        </>
      )}

      <Block className="space-y-3">
        <Button large rounded disabled={!valid} onClick={onSave}>
          {t('food.saveDish')}
        </Button>
        {onDelete && (
          <Button large rounded clear colors={{ textIos: 'text-danger' }} onClick={onDelete}>
            {t('food.deleteDish')}
          </Button>
        )}
      </Block>
    </>
  )
}
