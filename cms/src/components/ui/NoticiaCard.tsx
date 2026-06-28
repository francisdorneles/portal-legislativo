import Link from 'next/link'
import type { Noticia } from '@/payload-types'
import { formatarData } from '@/lib/format'
import { mediaUrl, mediaAlt } from '@/lib/media'

const CATEGORIA_LABEL: Record<string, string> = {
  sessoes: 'Sessões',
  projetos: 'Projetos de Lei',
  comunicados: 'Comunicados',
  eventos: 'Eventos',
  geral: 'Geral',
}

/** Card de notícia — reutilizado na home e na listagem. */
export function NoticiaCard({ noticia }: { noticia: Noticia }) {
  const categoria = noticia.categoria ? (CATEGORIA_LABEL[noticia.categoria] ?? noticia.categoria) : 'Geral'
  const foto = mediaUrl(noticia.foto)
  // O card INTEIRO é o link (toda a notícia é clicável). O "Ler mais" é só um
  // rótulo visual (span) — não pode ser <a> aninhado dentro de <a>.
  return (
    <Link className={`card${foto ? '' : ' card--sem-foto'}`} href={`/noticias/${noticia.slug}`}>
      {foto && (
        <div className="img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt={mediaAlt(noticia.foto, noticia.titulo)} />
        </div>
      )}
      <div className="b">
        <div className="meta">
          <span className="cat">{categoria}</span>
          <span className="dot"></span>
          <span className="date">{formatarData(noticia.data)}</span>
        </div>
        <h3>{noticia.titulo}</h3>
        {noticia.resumo && <p>{noticia.resumo}</p>}
        <span className="m">Ler mais →</span>
      </div>
    </Link>
  )
}
