import { useTranslation } from 'react-i18next'
import type { Goals } from '../db/settings'

type Macros = Pick<Goals, 'protein' | 'carbs' | 'fat'>

const MACROS = [
  { key: 'protein', bar: 'bg-protein' },
  { key: 'carbs', bar: 'bg-carbs' },
  { key: 'fat', bar: 'bg-fat' },
] as const

// Barras de proteína, carbohidratos y grasas consumidos frente al objetivo (en gramos).
export function MacroBars({ eaten, goals }: { eaten: Macros; goals: Macros }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col gap-3">
      {MACROS.map(({ key, bar }) => (
        <div key={key}>
          <div className="flex justify-between text-[13px]">
            <span className="text-label-2">{t(`macros.${key}`)}</span>
            <span className="tabular-nums">
              {Math.round(eaten[key])}/{goals[key]} g
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(eaten[key] / goals[key], 1) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
