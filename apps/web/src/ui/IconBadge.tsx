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
export function IconBadge({ Icon, tone, size = 'md' }: { Icon: LucideIcon; tone: Tone; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-16 w-16 rounded-2xl' : 'h-[30px] w-[30px] rounded-[7px]'
  const icon = size === 'lg' ? 'h-8 w-8' : 'h-[18px] w-[18px]'
  return (
    <div className={`flex items-center justify-center text-white ${box} ${TONES[tone]}`}>
      <Icon className={icon} strokeWidth={2.2} />
    </div>
  )
}
