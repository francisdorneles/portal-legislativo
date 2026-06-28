import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { formatarData } from '@/lib/format'
import { obterNorma, relacoesDaNorma, type RelacaoNorma } from '@/modules/legislativo/normas.queries'
import { obterMateria } from '@/modules/legislativo/materias.queries'
import { urlDocumento } from '@/lib/documentos'
import { nomeCurto } from '@/lib/meta'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'

export const revalidate = 300

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const [n, sf] = await Promise.all([obterNorma(Number(id)), nomeCurto()])
  return { title: n ? `${n.__str__} — ${sf}` : 'Norma não encontrada' }
}

export default async function NormaPage({ params }: Params) {
  const { id } = await params
  const n = await obterNorma(Number(id))
  if (!n) notFound()

  const [origem, relacoes] = await Promise.all([
    n.materia ? obterMateria(n.materia) : Promise.resolve(null),
    relacoesDaNorma(n.id),
  ])
  const temRelacoes = relacoes.ativas.length > 0 || relacoes.passivas.length > 0

  return (
    <ArtigoLayout
      titulo={n.__str__}
      prelude={<Link href="/legislacao" className="voltar">← Legislação</Link>}
    >
      <dl className="ficha">
        <div>
          <dt>Publicação</dt>
          <dd>{formatarData(n.data)}</dd>
        </div>
        <div>
          <dt>Número / Ano</dt>
          <dd>{n.numero}/{String(n.ano)}</dd>
        </div>
      </dl>

      <h2 className="sec-titulo">Ementa</h2>
      <p>{n.ementa}</p>

      {urlDocumento(n.texto_integral) && (
        <p>
          <a className="btn btn-am" href={urlDocumento(n.texto_integral)!} target="_blank" rel="noopener noreferrer">
            Ver texto integral (PDF)
          </a>
        </p>
      )}

      {origem && (
        <p className="resultado-lei">
          Originada do{' '}
          <Link href={`/processo-legislativo/${origem.id}`}><strong>{origem.__str__}</strong></Link>.
        </p>
      )}

      {temRelacoes && (
        <>
          <h2 className="sec-titulo">Relações com outras normas</h2>
          <ul className="relacoes">
            {[...relacoes.ativas, ...relacoes.passivas].map((r) => (
              <RelacaoItem key={r.id} r={r} />
            ))}
          </ul>
        </>
      )}

      {n.indexacao && (
        <>
          <h2 className="sec-titulo">Indexação</h2>
          <p>{n.indexacao}</p>
        </>
      )}
    </ArtigoLayout>
  )
}

function RelacaoItem({ r }: { r: RelacaoNorma }) {
  return (
    <li>
      <span className="relacao-rotulo">{r.rotulo}</span>
      <div>
        {r.norma ? (
          <Link className="relacao-norma" href={`/legislacao/${r.norma.id}`}>
            Lei nº {r.norma.numero}/{String(r.norma.ano)}
          </Link>
        ) : (
          <span className="relacao-norma">Norma não localizada</span>
        )}
      </div>
      {r.norma?.ementa && <p className="relacao-ementa">{r.norma.ementa}</p>}
      {r.resumo && <p className="relacao-resumo">{r.resumo}</p>}
    </li>
  )
}
