import type { ReactNode } from 'react'

/**
 * Layout ÚNICO das páginas internas (Next.js aninhado).
 * Envolve automaticamente todas as páginas deste grupo na mesma moldura/margem.
 * Mudar a largura/margem do site interno = mexer SÓ aqui (e em `.pagina`/`.wrap`).
 * As páginas só devolvem o conteúdo — não repetem container.
 *
 * O home (/) fica fora deste grupo porque tem hero full-bleed próprio.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <div className="pagina wrap">{children}</div>
}
