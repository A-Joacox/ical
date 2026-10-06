import { useState } from 'react'
import { Block, BlockFooter, BlockTitle, Button, List, ListInput } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import type { FoodValues } from './data'

// Acepta coma decimal. Vacío o inválido → undefined.
function parseNumber(text: string) {
  const value = Number(text.replace(',', '.'))
  return text.trim() && Number.isFinite(value) && value >= 0 ? value : undefined
}

const NUTRIENT_FIELDS = [
  { key: 'kcal', label: 'food.kcal' },
  { key: 'protein', label: 'food.protein' },
  { key: 'carbs', label: 'food.carbs' },
  { key: 'fat', label: 'food.fat' },
] as const

type Props = { initialName: string; barcode?: string; onSave: (values: FoodValues) => void }

// Alimento propio con los datos de la etiqueta (por 100 g).
export function FoodForm({ initialName, barcode, onSave }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState({ name: initialName, brand: '', kcal: '', protein: '', carbs: '', fat: '', serving: '' })
  const set = (key: keyof typeof text) => (event: { target: { value: string } }) => setText({ ...text, [key]: event.target.value })
  const kcal = parseNumber(text.kcal)
  const valid = !!text.name.trim() && kcal !== undefined

  const save = () =>
    onSave({
      name: text.name.trim(),
      brand: text.brand.trim() || undefined,
      barcode,
      kcal: kcal!,
      protein: parseNumber(text.protein) ?? 0,
      carbs: parseNumber(text.carbs) ?? 0,
      fat: parseNumber(text.fat) ?? 0,
      servingGrams: parseNumber(text.serving) || undefined,
    })

  return (
    <>
      <List strong inset>
        <ListInput label={t('food.name')} value={text.name} onChange={set('name')} />
        <ListInput label={t('food.brand')} value={text.brand} onChange={set('brand')} />
      </List>
      {barcode && <BlockFooter className="-mt-4">{t('food.barcodeLabel', { code: barcode })}</BlockFooter>}

      <BlockTitle>{t('food.per100')}</BlockTitle>
      <List strong inset>
        {NUTRIENT_FIELDS.map(({ key, label }) => (
          <ListInput key={key} label={t(label)} inputMode="decimal" placeholder="0" value={text[key]} onChange={set(key)} />
        ))}
      </List>

      <List strong inset>
        <ListInput label={t('food.servingGrams')} inputMode="decimal" value={text.serving} onChange={set('serving')} />
      </List>

      <Block>
        <Button large rounded disabled={!valid} onClick={save}>
          {t('food.saveAndContinue')}
        </Button>
      </Block>
    </>
  )
}
