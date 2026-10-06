import { Fragment } from 'react'
import { BlockTitle, List, ListButton, ListItem, Searchbar } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { normalize } from '../../text'
import { ExerciseThumb } from './ExerciseMedia'
import { useExerciseMap, useExerciseName } from './hooks'
import { MUSCLES, type Exercise } from './types'

/** Buscador de ejercicios. Va en el `subnavbar` del Navbar para que respete la zona segura. */
export function ExerciseSearchbar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation()
  return (
    <Searchbar
      placeholder={t('gym.search')}
      value={value}
      clearButton
      onInput={(event) => onChange(event.target.value)}
      onClear={() => onChange('')}
    />
  )
}

type Props = {
  query: string
  onSelect: (exercise: Exercise) => void
  /** Si se pasa, permite crear un ejercicio propio con el texto buscado. */
  onCreate?: (name: string) => void
}

// Ejercicios agrupados por músculo y filtrados por la búsqueda. Se usa en la biblioteca y al añadir ejercicios.
export function ExerciseList({ query, onSelect, onCreate }: Props) {
  const { t } = useTranslation()
  const exercises = useExerciseMap()
  const name = useExerciseName()

  const q = normalize(query.trim())
  const matches = [...(exercises?.values() ?? [])]
    .filter((e) => !q || normalize(e.nameEs).includes(q) || normalize(e.nameEn).includes(q))
    .sort((a, b) => name(a).localeCompare(name(b)))

  return (
    <>
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
