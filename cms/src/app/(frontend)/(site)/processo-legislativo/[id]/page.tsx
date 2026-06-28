import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { formatarData } from '@/lib/format'
import { obterMateria } from '@/modules/legislativo/materias.queries'
import { listarTramitacao } from '@/modules/legislativo/tramitacao.queries'
import { votacoesDaMateria } from '@/modules/legislativo/votacao.queries'
import { VotacaoBox } from '@/components/ui/VotacaoBox'
import { normaDaMateria } from '@/modules/legislativo/normas.queries'
import { pareceresDaMateria } from '@/modules/legislativo/pareceres.queries'
import { autoresDaMateria } from '@/modules/legislativo/autoria.queries'
import { urlDocumento } from '@/lib/documentos'
import { nomeCurto } from '@/lib/meta'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'

export const revalidate = 300

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const [m, sf] = await Promise.all([obterMateria(Number(id)), nomeCurto()])
  return { title: m ? `${m.__str__} — ${sf}` : 'Matéria não encontrada' }
}

export default async function MateriaPage({ params }: Params) {
  const { id } = await params
  const m = await obterMateria(Number(id))
  if (!m) notFound()

  const [tramitacao, votacoes, norma, pareceres, autores] = await Promise.all([
    listarTramitacao(m.id),
    votacoesDaMateria(m.id),
    normaDaMateria(m.id),
    pareceresDaMateria(m.id),
    autoresDaMateria(m.id),
  ])

  return (
    <ArtigoLayout
      titulo={m.__str__}
      prelude={<Link href="/processo-legislativo" className="voltar">← Processo Legislativo</Link>}
    >
      <span className={`badge ${m.em_tramitacao ? 'badge-on' : 'badge-off'}`} style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
        {m.em_tramitacao ? 'Em tramitação' : 'Encerrado'}
      </span>

      <dl className="ficha">
        {autores.length > 0 && (
          <div>
            <dt>Autoria</dt>
            <dd>
              {autores.map((a, i) => (
                <span key={i}>
                  {a.parlamentarId ? (
                    <Link href={`/vereadores/${a.parlamentarId}`}>{a.nome}</Link>
                  ) : (
                    a.nome
                  )}
                  {i < autores.length - 1 ? ', ' : ''}
                </span>
              ))}
            </dd>
          </div>
        )}
        <div>
          <dt>Apresentação</dt>
          <dd>{formatarData(m.data_apresentacao)}</dd>
        </div>
        {m.data_publicacao && (
          <div>
            <dt>Publicação</dt>
            <dd>{formatarData(m.data_publicacao)}</dd>
          </div>
        )}
        <div>
          <dt>Número / Ano</dt>
          <dd>{m.numero}/{String(m.ano)}</dd>
        </div>
      </dl>

      <h2 className="sec-titulo">Ementa</h2>
      <p>{m.ementa}</p>

      {urlDocumento(m.texto_original) && (
        <p>
          <a className="btn btn-am" href={urlDocumento(m.texto_original)!} target="_blank" rel="noopener noreferrer">
            Ver texto integral (PDF)
          </a>
        </p>
      )}

      {m.indexacao && (
        <>
          <h2 className="sec-titulo">Indexação</h2>
          <p>{m.indexacao}</p>
        </>
      )}

      {m.observacao && (
        <>
          <h2 className="sec-titulo">Observação</h2>
          <p>{m.observacao}</p>
        </>
      )}

      {norma && (
        <>
          <h2 className="sec-titulo">Resultado</h2>
          <p className="resultado-lei">
            ✓ Este projeto foi convertido na{' '}
            <Link href={`/legislacao/${norma.id}`}><strong>{norma.__str__}</strong></Link>.
          </p>
        </>
      )}

      {votacoes.length > 0 && (
        <>
          <h2 className="sec-titulo">Votação em Plenário</h2>
          {votacoes.map((v, i) => (
            <div key={i} className="votacao-materia">
              <VotacaoBox votacao={v} presentes={v.presentes} aberto titulo={v.turno} />
              {v.sessaoId && (
                <p className="materia-data" style={{ marginTop: '0.4rem' }}>
                  <Link href={`/sessoes/${v.sessaoId}`}>Ver {v.sessaoLabel} →</Link>
                </p>
              )}
            </div>
          ))}
        </>
      )}

      {pareceres.length > 0 && (
        <>
          <h2 className="sec-titulo">Pareceres das Comissões</h2>
          <ul className="pareceres">
            {pareceres.map((p) => (
              <li key={p.id}>
                <div className="parecer-head">
                  <strong>{p.comissao}</strong>
                  <span className={`badge ${p.conclusao === 'Contrário' ? 'badge-off' : 'badge-on'}`}>{p.conclusao}</span>
                </div>
                {p.relator && <span className="parecer-relator">Relator: {p.relator}</span>}
                {p.texto && <p className="parecer-texto">{p.texto}</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="sec-titulo">Tramitação</h2>
      {tramitacao.length === 0 ? (
        <p className="vazio">Sem movimentações de tramitação registradas.</p>
      ) : (
        <ol className="tramitacao">
          {tramitacao.map((t) => (
            <li key={t.id}>
              <span className="tram-data">{formatarData(t.data_tramitacao)}</span>
              <div className="tram-corpo">
                <strong className="tram-status">{t.statusDescricao}</strong>
                {t.texto && <p className="tram-texto">{t.texto}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </ArtigoLayout>
  )
}
