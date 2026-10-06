import { Block } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { useGoals } from '../../db/settings'
import { MacroBars } from '../../ui/MacroBars'
import { ProgressRing } from '../../ui/ProgressRing'
import type { Nutrients } from './types'

// Anillo de kcal restantes (o de más, en rojo) y barras de macros frente a los objetivos.
export function DaySummary({ eaten }: { eaten: Nutrients }) {
  const { t, i18n } = useTranslation()
  const goals = useGoals()
  const over = eaten.kcal > goals.kcal
  const kcal = Math.round(Math.abs(goals.kcal - eaten.kcal))

  return (
    <Block strong inset className="flex items-center gap-5">
      <ProgressRing progress={eaten.kcal / goals.kcal} colorClassName={over ? 'text-danger' : 'text-food'}>
        <span className="text-[28px] font-bold leading-none tabular-nums">{kcal.toLocaleString(i18n.language)}</span>
        <span className="mt-1 text-[12px] text-label-2">{t(over ? 'food.kcalOver' : 'today.kcalLeft')}</span>
      </ProgressRing>
      <MacroBars eaten={eaten} goals={goals} />
    </Block>
  )
}
