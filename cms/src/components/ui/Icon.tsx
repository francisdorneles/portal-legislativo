/** Ícones de linha reutilizáveis. Adicione novos em ICONS por nome. */
import type { CSSProperties } from 'react'

const ICONS = {
  documento: ['M4 4h16v16H4z', 'M8 9h8', 'M8 13h5'],
  arquivo: ['M6 3h9l5 5v13H6z', 'M14 3v6h6'],
  predio: ['M3 21V8l9-5 9 5v13', 'M9 21v-6h6v6'],
  balao: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  calendario: ['M3 5h18v16H3z', 'M3 9h18', 'M8 3v4', 'M16 3v4'],
  pessoas: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 21v-2a4 4 0 0 0-3-3.87'],
  livro: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  lista: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  megafone: ['M3 11l15-5v13L3 14z', 'M3 11v3', 'M10 17.5a2.5 2.5 0 0 1-4.8-.9'],
  predio2: ['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 21v-5h6v5', 'M9 10h.01', 'M15 10h.01'],
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  className,
  size = 24,
  style,
}: {
  name: IconName
  className?: string
  size?: number
  style?: CSSProperties
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {ICONS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
