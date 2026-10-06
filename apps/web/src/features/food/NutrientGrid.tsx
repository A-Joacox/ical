import { useTranslation } from 'react-i18next'
import type { Nutrients } from './types'

// kcal y macros en cuatro columnas, con los colores de cada macro.
export function NutrientGrid({ values }: { values: Nutrients }) {
  const { t } = useTranslation()
  const items = [
    { label: 'kcal', value: Math.round(values.kcal), color: 'text-food' },
    { label: t('macros.protein'), value: `${Math.round(values.protein)} g`, color: 'text-protein' },
    { label: t('macros.carbs'), value: `${Math.round(values.carbs)} g`, color: 'text-carbs' },
    { label: t('macros.fat'), value: `${Math.round(values.fat)} g`, color: 'text-fat' },
  ]

  return (
    <div className="grid grid-cols-4 text-center">
      {items.map((item) => (
        <div key={item.label}>
          <div className={`text-[20px] font-bold tabular-nums ${item.color}`}>{item.value}</div>
          <div className="text-[12px] text-label-2">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
