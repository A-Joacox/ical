import { Link, Navbar, Page, Popup } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { createExercise } from './data'
import { ExerciseList } from './ExerciseList'

type Props = { opened: boolean; onClose: () => void; onPick: (exerciseId: string) => void }

// Modal a pantalla completa para elegir (o crear) un ejercicio.
export function ExercisePicker({ opened, onClose, onPick }: Props) {
  const { t } = useTranslation()

  const pick = (exerciseId: string) => {
    onPick(exerciseId)
    onClose()
  }

  return (
    <Popup opened={opened} onBackdropClick={onClose}>
      <Page>
        <Navbar title={t('gym.addExercise')} right={<Link onClick={onClose}>{t('gym.close')}</Link>} />
        {opened && (
          <ExerciseList
            onSelect={(exercise) => pick(exercise.id)}
            onCreate={async (name) => pick(await createExercise(name))}
          />
        )}
      </Page>
    </Popup>
  )
}
