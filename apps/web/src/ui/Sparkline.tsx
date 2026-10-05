// Línea simple de evolución (sin ejes) para valores en orden cronológico.
export function Sparkline({ values, colorClassName }: { values: number[]; colorClassName: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const points = values.map((value, i) => `${(i / (values.length - 1)) * 100},${36 - ((value - min) / range) * 32}`)

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={`h-16 w-full ${colorClassName}`}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
