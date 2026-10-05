import { Navbar, NavbarBackLink } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { TabPage } from '../../ui/TabPage'
import { createExercise } from './data'
import { ExerciseList } from './ExerciseList'

// Biblioteca de ejercicios.
export function ExercisesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <TabPage>
      <Navbar title={t('gym.library')} left={<NavbarBackLink text={t('tabs.gym')} onClick={() => navigate('/gym')} />} />
      <ExerciseList
        onSelect={(exercise) => navigate(`/gym/exercises/${exercise.id}`)}
        onCreate={async (name) => navigate(`/gym/exercises/${await createExercise(name)}`)}
      />
    </TabPage>
  )
}
