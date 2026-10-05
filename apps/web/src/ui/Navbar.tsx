import type { ComponentProps } from 'react'
import { Navbar as KonstaNavbar } from 'konsta/react'

// Fondo más opaco que el translúcido de Konsta (iOS 26): al hacer scroll, el contenido no
// se ve detrás del título ni de los botones.
const COLORS = { bgIos: 'bg-gradient-to-b from-black from-70% to-transparent' }

export function Navbar(props: ComponentProps<typeof KonstaNavbar>) {
  return <KonstaNavbar colors={COLORS} {...props} />
}
