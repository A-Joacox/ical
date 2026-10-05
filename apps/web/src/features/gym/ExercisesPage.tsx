import { useState } from 'react'
import { Navbar, NavbarBackLink } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { TabPage } from '../../ui/TabPage'
import { createExercise } from './data'
import { ExerciseList, ExerciseSearchbar, SEARCH_NAVBAR_COLORS } from './ExerciseList'

// Biblioteca de ejercicios.
export function ExercisesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  return (
    <TabPage>
      <Navbar
        title={t('gym.library')}
        left={<NavbarBackLink text={t('tabs.gym')} onClick={() => navigate('/gym')} />}
        subnavbar={<ExerciseSearchbar value={query} onChange={setQuery} />}
        colors={SEARCH_NAVBAR_COLORS}
      />
      <ExerciseList
        query={query}
        onSelect={(exercise) => navigate(`/gym/exercises/${exercise.id}`)}
        onCreate={async (name) => navigate(`/gym/exercises/${await createExercise(name)}`)}
      />
    </TabPage>
  )
}
