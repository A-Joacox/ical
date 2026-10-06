import { Block, BlockTitle, Segmented, SegmentedButton } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { SEGMENTED_COLORS } from '../../ui/segmented'
import { MEALS, type Meal } from './types'

// Desayuno · Almuerzo · Cena · Snacks.
export function MealPicker({ meal, onChange }: { meal: Meal; onChange: (meal: Meal) => void }) {
  const { t } = useTranslation()
  return (
    <>
      <BlockTitle>{t('food.meal')}</BlockTitle>
      <Block>
        <Segmented strong colors={SEGMENTED_COLORS}>
          {MEALS.map((value) => (
            <SegmentedButton key={value} active={meal === value} className="text-white" onClick={() => onChange(value)}>
              {t(`food.meals.${value}`)}
            </SegmentedButton>
          ))}
        </Segmented>
      </Block>
    </>
  )
}
