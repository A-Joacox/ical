import { Fragment, useState } from 'react'
import { BlockTitle, List, ListButton, ListItem, Searchbar } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { ExerciseThumb } from './ExerciseMedia'
import { useExerciseMap, useExerciseName } from './hooks'
import { MUSCLES, type Exercise } from './types'

// Sin tildes y en minúsculas, para que "press banca" encuentre "Press de banca".
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

type Props = {
  onSelect: (exercise: Exercise) => void
  /** Si se pasa, permite crear un ejercicio propio con el texto buscado. */
  onCreate?: (name: string) => void
}

// Buscador + ejercicios agrupados por músculo. Se usa en la biblioteca y al añadir ejercicios.
export function ExerciseList({ onSelect, onCreate }: Props) {
  const { t } = useTranslation()
  const exercises = useExerciseMap()
  const name = useExerciseName()
  const [query, setQuery] = useState('')

  const q = normalize(query.trim())
  const matches = [...(exercises?.values() ?? [])]
    .filter((e) => !q || normalize(e.nameEs).includes(q) || normalize(e.nameEn).includes(q))
    .sort((a, b) => name(a).localeCompare(name(b)))

  return (
    <>
      <Searchbar
        placeholder={t('gym.search')}
        value={query}
        clearButton
        onInput={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />

      {onCreate && query.trim() && (
        <List strong inset>
          <ListButton onClick={() => onCreate(query.trim())}>{t('gym.create', { name: query.trim() })}</ListButton>
        </List>
      )}

      {MUSCLES.map((muscle) => {
        const items = matches.filter((e) => e.muscle === muscle)
        if (!items.length) return null
        return (
          <Fragment key={muscle}>
            <BlockTitle>{t(`muscles.${muscle}`)}</BlockTitle>
            <List strong inset dividers>
              {items.map((exercise) => (
                <ListItem
                  key={exercise.id}
                  link
                  title={name(exercise)}
                  media={<ExerciseThumb exercise={exercise} />}
                  onClick={() => onSelect(exercise)}
                />
              ))}
            </List>
          </Fragment>
        )
      })}
    </>
  )
}
