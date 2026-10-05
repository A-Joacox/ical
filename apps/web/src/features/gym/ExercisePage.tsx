import { Block, BlockFooter, BlockTitle, List, ListItem, NavbarBackLink } from 'konsta/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { db } from '../../db/db'
import { useWeightUnit } from '../../db/settings'
import { Sparkline } from '../../ui/Sparkline'
import { TabPage } from '../../ui/TabPage'
import { getExerciseHistory } from './data'
import { ExerciseAnimation } from './ExerciseMedia'
import { useExerciseName } from './hooks'
import { displayWeight, estimate1RM } from './stats'
import { Navbar } from '../../ui/Navbar'

// Detalle de un ejercicio: animación, récords, progreso e historial.
export function ExercisePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const exercise = useLiveQuery(async () => (await db.exercises.get(id)) ?? null, [id])
  const history = useLiveQuery(() => getExerciseHistory(id), [id])
  const name = useExerciseName()
  const unit = useWeightUnit()

  if (exercise === undefined || history === undefined) return null

  const best1RMs = history.flatMap((h) => (h.best ? [estimate1RM(h.best.weightKg!, h.best.reps!)] : []))
  const heaviest = Math.max(0, ...history.map((h) => h.maxWeightKg))
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })
  const weight = (kg: number) => `${displayWeight(kg, unit)} ${unit}`

  return (
    <TabPage>
      <Navbar
        title={name(exercise ?? undefined)}
        left={<NavbarBackLink text={t('gym.close')} showText={false} onClick={() => navigate(-1)} />}
      />

      {exercise?.media && (
        <>
          <Block className="mx-auto max-w-sm">
            <ExerciseAnimation media={exercise.media} />
          </Block>
          <BlockFooter className="-mt-4 text-center">{t('gym.mediaCredit')}</BlockFooter>
        </>
      )}

      {exercise && <p className="px-4 text-center text-[15px] text-label-2">{t(`muscles.${exercise.muscle}`)}</p>}

      {history.length === 0 ? (
        <Block className="text-center text-[15px] text-label-2">{t('gym.noExerciseHistory')}</Block>
      ) : (
        <>
          <BlockTitle>{t('gym.records')}</BlockTitle>
          <List strong inset dividers>
            <ListItem title={t('gym.heaviest')} after={weight(heaviest)} />
            <ListItem title={t('gym.best1RM')} after={weight(Math.max(0, ...best1RMs))} />
          </List>

          {best1RMs.length > 1 && (
            <>
              <BlockTitle>{t('gym.progress')}</BlockTitle>
              <Block strong inset>
                <Sparkline values={[...best1RMs].reverse()} colorClassName="text-gym" />
              </Block>
            </>
          )}

          <BlockTitle>{t('gym.history')}</BlockTitle>
          <List strong inset dividers>
            {history.map((h) => (
              <ListItem
                key={h.workoutId}
                link
                title={dateFormat.format(h.date)}
                after={h.best ? `${weight(h.best.weightKg!)} × ${h.best.reps}` : '—'}
                onClick={() => navigate(`/gym/workouts/${h.workoutId}`)}
              />
            ))}
          </List>
        </>
      )}
    </TabPage>
  )
}
