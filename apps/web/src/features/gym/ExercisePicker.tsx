import { useState } from 'react'
import { Link, Page, Popup } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { createExercise } from './data'
import { ExerciseList, ExerciseSearchbar } from './ExerciseList'
import { Navbar } from '../../ui/Navbar'

type Props = { opened: boolean; onClose: () => void; onPick: (exerciseId: string) => void }

// Modal a pantalla completa para elegir (o crear) un ejercicio.
export function ExercisePicker({ opened, onClose, onPick }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const close = () => {
    setQuery('')
    onClose()
  }
  const pick = (exerciseId: string) => {
    onPick(exerciseId)
    close()
  }

  return (
    <Popup opened={opened} onBackdropClick={close}>
      <Page>
        <Navbar
          title={t('gym.addExercise')}
          right={<Link onClick={close}>{t('gym.close')}</Link>}
          subnavbar={<ExerciseSearchbar value={query} onChange={setQuery} />}
        />
        {opened && (
          <ExerciseList
            query={query}
            onSelect={(exercise) => pick(exercise.id)}
            onCreate={async (name) => pick(await createExercise(name))}
          />
        )}
      </Page>
    </Popup>
  )
}
