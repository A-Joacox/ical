import { Dumbbell } from 'lucide-react'
import type { Exercise } from './types'

// Fotos de free-exercise-db (dominio público). El service worker las guarda para verlas offline.
const MEDIA_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'
const imageUrl = (media: string, frame: 0 | 1) => `${MEDIA_BASE}/${media}/${frame}.jpg`

/** Animación del ejercicio: alterna la foto de inicio y la de fin del movimiento. */
export function ExerciseAnimation({ media }: { media: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white">
      <img src={imageUrl(media, 0)} crossOrigin="anonymous" alt="" className="block w-full" />
      <img
        src={imageUrl(media, 1)}
        crossOrigin="anonymous"
        alt=""
        className="absolute inset-0 h-full w-full animate-exercise-frame object-cover"
      />
    </div>
  )
}

/** Miniatura cuadrada (primera foto) o un ícono si el ejercicio es propio. */
export function ExerciseThumb({ exercise }: { exercise: Exercise | undefined }) {
  if (!exercise?.media) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-gym">
        <Dumbbell className="h-5 w-5" />
      </div>
    )
  }
  return (
    <img
      src={imageUrl(exercise.media, 0)}
      crossOrigin="anonymous"
      alt=""
      loading="lazy"
      className="h-11 w-11 shrink-0 rounded-lg bg-white object-cover"
    />
  )
}
