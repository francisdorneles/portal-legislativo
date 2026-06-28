import type { ReactNode } from 'react'

interface ArtigoLayoutProps {
  titulo: string
  data?: string
  fotoUrl?: string
  fotoAlt?: string
  children: ReactNode
  /** Conteúdo renderizado ACIMA do título (ex: link "← Voltar"). */
  prelude?: ReactNode
  rodape?: ReactNode
  /** Centraliza a coluna de leitura na página (só para notícias). */
  centralizar?: boolean
}

/**
 * Shell visual de qualquer página de conteúdo longo (notícia, institucional, etc).
 * A página injeta apenas titulo, data, foto e children (corpo).
 * Todo o estilo vive aqui e nos seletores .artigo/.prosa do CSS.
 */
export function ArtigoLayout({ titulo, data, fotoUrl, fotoAlt, children, prelude, rodape, centralizar }: ArtigoLayoutProps) {
  return (
    <>
      <article className="artigo" style={centralizar ? { marginInline: 'auto' } : undefined}>
        {prelude}
        <h1 className="artigo-titulo">{titulo}</h1>
        {data && (
          <span className="date" style={{ color: 'var(--cinza)', fontWeight: 600 }}>
            {data}
          </span>
        )}
        {fotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="foto-destaque" src={fotoUrl} alt={fotoAlt ?? titulo} />
        )}
        <div className="prosa">{children}</div>
      </article>

      {rodape}
    </>
  )
}
