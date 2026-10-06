import { Block, BlockTitle, List, ListItem, NavbarBackLink, Segmented, SegmentedButton } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { saveGoals, saveWeightUnit, useGoals, useWeightUnit, type Goals } from '../../db/settings'
import { LANGUAGES } from '../../i18n'
import { SEGMENTED_COLORS } from '../../ui/segmented'
import { TabPage } from '../../ui/TabPage'
import { AccountSection } from './AccountSection'
import { BackupSection } from './BackupSection'
import { NotificationsSection } from './NotificationsSection'
import { Navbar } from '../../ui/Navbar'

const LANGUAGE_NAMES = { es: 'Español', en: 'English' } as const
const WEIGHT_UNITS = ['kg', 'lb'] as const

const GOAL_FIELDS = [
  { key: 'kcal', label: 'settings.kcal' },
  { key: 'protein', label: 'settings.proteinG' },
  { key: 'carbs', label: 'settings.carbsG' },
  { key: 'fat', label: 'settings.fatG' },
] as const

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const goals = useGoals()
  const unit = useWeightUnit()

  // Guarda al salir del campo; un valor inválido vuelve al anterior.
  const onGoalBlur = (key: keyof Goals, input: HTMLInputElement) => {
    const value = Math.round(Number(input.value))
    if (value > 0) saveGoals({ ...goals, [key]: value })
    else input.value = String(goals[key])
  }

  return (
    <TabPage>
      <Navbar title={t('settings.title')} left={<NavbarBackLink text={t('tabs.today')} onClick={() => navigate('/')} />} />

      <BlockTitle>{t('settings.language')}</BlockTitle>
      <Block>
        <Segmented strong colors={SEGMENTED_COLORS}>
          {LANGUAGES.map((lng) => (
            <SegmentedButton
              key={lng}
              active={i18n.resolvedLanguage === lng}
              className="text-white"
              onClick={() => i18n.changeLanguage(lng)}
            >
              {LANGUAGE_NAMES[lng]}
            </SegmentedButton>
          ))}
        </Segmented>
      </Block>

      <BlockTitle>{t('settings.weightUnit')}</BlockTitle>
      <Block>
        <Segmented strong colors={SEGMENTED_COLORS}>
          {WEIGHT_UNITS.map((value) => (
            <SegmentedButton key={value} active={unit === value} className="text-white" onClick={() => saveWeightUnit(value)}>
              {value}
            </SegmentedButton>
          ))}
        </Segmented>
      </Block>

      <BlockTitle>{t('settings.goals')}</BlockTitle>
      <List strong inset dividers>
        {GOAL_FIELDS.map(({ key, label }) => (
          <ListItem
            key={`${key}-${goals[key]}`}
            label
            title={t(label)}
            after={
              <input
                type="number"
                inputMode="numeric"
                defaultValue={goals[key]}
                onBlur={(event) => onGoalBlur(key, event.target)}
                className="w-24 bg-transparent text-right text-[17px] tabular-nums text-label-2 outline-none"
              />
            }
          />
        ))}
      </List>

      <AccountSection />
      <BackupSection />
      <NotificationsSection />
    </TabPage>
  )
}
