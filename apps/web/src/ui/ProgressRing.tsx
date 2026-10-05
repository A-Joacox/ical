import type { ReactNode } from 'react'

type Props = {
  /** Fracción completada, de 0 a 1. */
  progress: number
  /** Clase de color de Tailwind para el trazo (p. ej. `text-food`). */
  colorClassName: string
  size?: number
  stroke?: number
  children?: ReactNode
}

// Anillo de progreso al estilo Apple Fitness, con contenido centrado.
export function ProgressRing({ progress, colorClassName, size = 136, stroke = 14, children }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(progress, 0), 1)

  return (
    <div className={`relative shrink-0 ${colorClassName}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" fill="none" stroke="currentColor" strokeWidth={stroke}>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeOpacity={0.22} />
        {clamped > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped)}
            className="transition-[stroke-dashoffset] duration-500"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">{children}</div>
    </div>
  )
}
