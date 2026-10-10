import type { LucideIcon } from 'lucide-react'

// Colores por módulo. Las clases completas deben aparecer literalmente para que Tailwind las genere.
export const TONES = {
  food: 'bg-food',
  gym: 'bg-gym',
  agenda: 'bg-agenda',
  server: 'bg-server',
} as const

export type Tone = keyof typeof TONES

// Ícono blanco sobre un cuadrado redondeado de color, como en Ajustes de iOS.
export function IconBadge({ Icon, tone }: { Icon: LucideIcon; tone: Tone }) {
  return (
    <div className={`flex h-[30px] w-[30px] items-center justify-center rounded-[7px] text-white ${TONES[tone]}`}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
    </div>
  )
}
