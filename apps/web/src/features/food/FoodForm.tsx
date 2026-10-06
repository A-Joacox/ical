import { useState } from 'react'
import { Block, BlockFooter, BlockTitle, Button, Link, List, ListButton, ListInput, ListItem, Segmented, SegmentedButton } from 'konsta/react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SEGMENTED_COLORS } from '../../ui/segmented'
import type { FoodValues } from './data'
import { UNIT_KINDS, type UnitKind } from './types'

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

// La porción tiene su propio campo; aquí van las demás medidas.
const MEASURE_KINDS = UNIT_KINDS.filter((kind) => kind !== 'serving')

type Props = {
  /** Valores con los que empieza: solo el nombre o el código al crear, todos al editar. */
  initial: Partial<FoodValues>
  submitLabel: string
  onSave: (values: FoodValues) => void
  onDelete?: () => void
}

const toText = (value: number | undefined) => (value === undefined ? '' : String(value))
const round1 = (value: number) => Math.round(value * 10) / 10

// Alimento con los datos de la etiqueta, para crearlo o corregirlo. Los valores se pueden escribir
// por 100 g o por porción (se guardan siempre por 100 g) y se le pueden añadir medidas caseras.
export function FoodForm({ initial, submitLabel, onSave, onDelete }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState({
    name: initial.name ?? '',
    brand: initial.brand ?? '',
    kcal: toText(initial.kcal),
    protein: toText(initial.protein),
    carbs: toText(initial.carbs),
    fat: toText(initial.fat),
    serving: toText(initial.servingGrams),
  })
  const [perServing, setPerServing] = useState(false)
  const [measures, setMeasures] = useState((initial.units ?? []).map((u) => ({ kind: u.kind, grams: String(u.grams) })))
  const { barcode } = initial
  const set = (key: keyof typeof text) => (event: { target: { value: string } }) => setText({ ...text, [key]: event.target.value })
  const kcal = parseNumber(text.kcal)
  const serving = parseNumber(text.serving) || undefined
  const valid = !!text.name.trim() && kcal !== undefined && (!perServing || !!serving)

  const setMeasure = (index: number, change: Partial<(typeof measures)[number]>) =>
    setMeasures(measures.map((m, i) => (i === index ? { ...m, ...change } : m)))
  const addMeasure = () => setMeasures([...measures, { kind: MEASURE_KINDS.find((k) => !measures.some((m) => m.kind === k)) ?? 'unit', grams: '' }])

  const save = () => {
    const factor = perServing ? 100 / serving! : 1
    const per100 = (value: string) => round1((parseNumber(value) ?? 0) * factor)
    const units = measures.flatMap((m) => {
      const grams = parseNumber(m.grams)
      return grams ? [{ kind: m.kind, grams }] : []
    })
    onSave({
      name: text.name.trim(),
      brand: text.brand.trim() || undefined,
      barcode,
      kcal: per100(text.kcal),
      protein: per100(text.protein),
      carbs: per100(text.carbs),
      fat: per100(text.fat),
      servingGrams: serving,
      units: units.length ? units : undefined,
    })
  }

  return (
    <>
      <List strong inset>
        <ListInput label={t('food.name')} value={text.name} onChange={set('name')} />
        <ListInput label={t('food.brand')} value={text.brand} onChange={set('brand')} />
        <ListInput label={t('food.servingGrams')} inputMode="decimal" value={text.serving} onChange={set('serving')} />
      </List>
      {barcode && <BlockFooter className="-mt-4">{t('food.barcodeLabel', { code: barcode })}</BlockFooter>}

      <BlockTitle>{t('food.nutrition')}</BlockTitle>
      <Block>
        <Segmented strong colors={SEGMENTED_COLORS}>
          <SegmentedButton active={!perServing} className="text-white" onClick={() => setPerServing(false)}>
            {t('food.per100Option')}
          </SegmentedButton>
          <SegmentedButton active={perServing} className="text-white" onClick={() => setPerServing(true)}>
            {serving ? t('food.perServingGrams', { grams: serving }) : t('food.perServingOption')}
          </SegmentedButton>
        </Segmented>
      </Block>
      <List strong inset>
        {NUTRIENT_FIELDS.map(({ key, label }) => (
          <ListInput key={key} label={t(label)} inputMode="decimal" placeholder="0" value={text[key]} onChange={set(key)} />
        ))}
      </List>
      {perServing && !serving && <BlockFooter inset>{t('food.servingRequired')}</BlockFooter>}

      <BlockTitle>{t('food.measures')}</BlockTitle>
      <List strong inset dividers>
        {measures.map((measure, index) => (
          <ListItem
            key={index}
            title={
              <select
                aria-label={t('food.measures')}
                value={measure.kind}
                onChange={(event) => setMeasure(index, { kind: event.target.value as UnitKind })}
                className="bg-transparent text-[17px] text-white outline-none"
              >
                {MEASURE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`food.units.${kind}`, { count: 1 })}
                  </option>
                ))}
              </select>
            }
            after={
              <span className="flex items-center gap-1.5">
                <input
                  inputMode="decimal"
                  aria-label={t('food.grams')}
                  placeholder="0"
                  value={measure.grams}
                  onChange={(event) => setMeasure(index, { grams: event.target.value })}
                  className="h-9 w-20 rounded-lg bg-surface-2 text-center text-[17px] tabular-nums text-white outline-none"
                />
                g
                <Link iconOnly aria-label={t('food.removeMeasure')} onClick={() => setMeasures(measures.filter((_, i) => i !== index))}>
                  <X className="h-5 w-5" />
                </Link>
              </span>
            }
          />
        ))}
        <ListButton onClick={addMeasure}>
          <Plus className="mr-1 h-5 w-5" />
          {t('food.addMeasure')}
        </ListButton>
      </List>
      <BlockFooter inset>{t('food.measuresHint')}</BlockFooter>

      <Block className="space-y-3">
        <Button large rounded disabled={!valid} onClick={save}>
          {submitLabel}
        </Button>
        {onDelete && (
          <Button large rounded clear colors={{ textIos: 'text-danger' }} onClick={onDelete}>
            {t('food.deleteFood')}
          </Button>
        )}
      </Block>
    </>
  )
}
