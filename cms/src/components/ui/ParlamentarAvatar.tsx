/**
 * Avatar circular de parlamentar — foto ou inicial como fallback.
 * Tamanhos: sm=40px (listas), md=62px (cards compactos), lg=96px (cards padrão).
 */

const SIZES = { sm: 40, md: 62, lg: 96 } as const
const FONTS = { sm: '1rem', md: '1.4rem', lg: '2rem' } as const

interface Props {
  nome: string
  fotoUrl?: string | null
  size?: keyof typeof SIZES
}

export function ParlamentarAvatar({ nome, fotoUrl, size = 'md' }: Props) {
  const px = SIZES[size]
  const fs = FONTS[size]
  return (
    <span
      style={{
        width: px, height: px, borderRadius: '50%', overflow: 'hidden',
        background: 'var(--navy)', color: 'var(--amarelo)',
        display: 'grid', placeItems: 'center', flexShrink: 0,
        fontFamily: 'var(--font-archivo)', fontWeight: 800, fontSize: fs,
      }}
      aria-hidden="true"
    >
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoUrl}
          alt={nome}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{nome.charAt(0)}</span>
      )}
    </span>
  )
}
