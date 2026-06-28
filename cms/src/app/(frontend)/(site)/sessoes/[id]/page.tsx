import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { formatarData } from '@/lib/format'
import { obterSessao, obterPauta, oradoresDaSessao, type Orador } from '@/modules/legislativo/sessoes.queries'
import { obterVotacaoPorOrdem, contarPresentes } from '@/modules/legislativo/votacao.queries'
import { VotacaoBox } from '@/components/ui/VotacaoBox'
import { ParlamentarAvatar } from '@/components/ui/ParlamentarAvatar'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { urlDocumento } from '@/lib/documentos'
import { nomeCurto } from '@/lib/meta'

export const revalidate = 300

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const [s, sf] = await Promise.all([obterSessao(Number(id)), nomeCurto()])
  return { title: s ? `${s.numero}ª ${s.tipoNome} — ${sf}` : 'Sessão não encontrada' }
}

export default async function SessaoPage({ params }: Params) {
  const { id } = await params
  const s = await obterSessao(Number(id))
  if (!s) notFound()

  const pauta = await obterPauta(s.id)
  const [votacoes, presentes, oradores] = await Promise.all([
    Promise.all(pauta.map((item) => obterVotacaoPorOrdem(item.id))),
    contarPresentes(s.id),
    oradoresDaSessao(s.id),
  ])
  const realizada = Boolean(s.data_fim)
  const temOradores = oradores.expediente.length > 0 || oradores.ordemDia.length > 0

  return (
    <ArtigoLayout
      titulo={`${s.numero}ª ${s.tipoNome}`}
      prelude={<Link href="/sessoes" className="voltar">← Sessões</Link>}
    >
      <span className={`badge ${realizada ? 'badge-off' : 'badge-on'}`} style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
        {realizada ? 'Realizada' : 'Agendada'}
      </span>

      <dl className="ficha">
        <div>
          <dt>Data</dt>
          <dd>{formatarData(s.data_inicio)}</dd>
        </div>
        {s.hora_inicio && (
          <div>
            <dt>Horário</dt>
            <dd>
              {s.hora_inicio}
              {s.hora_fim ? ` – ${s.hora_fim}` : ''}
            </dd>
          </div>
        )}
        <div>
          <dt>Número</dt>
          <dd>{s.numero}ª</dd>
        </div>
      </dl>

      <h2 className="sec-titulo">Ordem do Dia</h2>
      {pauta.length === 0 ? (
        <p className="vazio">Pauta ainda não disponível para esta sessão.</p>
      ) : (
        <ul className="materias">
          {pauta.map((item, i) => {
            const v = votacoes[i]
            return (
              <li key={item.id}>
                <Link href={`/processo-legislativo/${item.materia}`}>
                  <div className="materia-top">
                    <span className="materia-id">{item.materiaTitulo}</span>
                    {item.resultado && <span className="badge badge-off">{item.resultado}</span>}
                  </div>
                  {item.materiaEmenta && <p className="materia-ementa">{item.materiaEmenta}</p>}
                </Link>

                {v && <VotacaoBox votacao={v} presentes={presentes} />}
              </li>
            )
          })}
        </ul>
      )}

      {temOradores && (
        <>
          <h2 className="sec-titulo" style={{ marginTop: '1.4rem' }}>Oradores</h2>
          {oradores.expediente.length > 0 && (
            <ListaOradores titulo="Expediente" oradores={oradores.expediente} />
          )}
          {oradores.ordemDia.length > 0 && (
            <ListaOradores titulo="Ordem do Dia" oradores={oradores.ordemDia} />
          )}
        </>
      )}

      {(s.upload_pauta || s.upload_ata || s.url_video || s.url_audio) && (
        <>
          <h2 className="sec-titulo">Documentos e mídia</h2>
          <ul className="lista-mini">
            {urlDocumento(s.upload_pauta) && (
              <li>
                <a href={urlDocumento(s.upload_pauta)!} target="_blank" rel="noopener noreferrer">
                  Pauta da sessão (PDF)
                </a>
              </li>
            )}
            {urlDocumento(s.upload_ata) && (
              <li>
                <a href={urlDocumento(s.upload_ata)!} target="_blank" rel="noopener noreferrer">
                  Ata da sessão (PDF)
                </a>
              </li>
            )}
            {s.url_video && (
              <li>
                <a href={s.url_video} target="_blank" rel="noopener noreferrer">
                  Vídeo da sessão
                </a>
              </li>
            )}
            {s.url_audio && (
              <li>
                <a href={s.url_audio} target="_blank" rel="noopener noreferrer">
                  Áudio da sessão
                </a>
              </li>
            )}
          </ul>
        </>
      )}
    </ArtigoLayout>
  )
}

function ListaOradores({ titulo, oradores }: { titulo: string; oradores: Orador[] }) {
  return (
    <div className="oradores-grupo">
      <h3 className="oradores-fase">{titulo}</h3>
      <ol className="oradores">
        {oradores.map((o) => (
          <li key={o.id}>
            <Link className="orador-nome" href={`/vereadores/${o.parlamentarId}`}>
              <ParlamentarAvatar nome={o.nome} fotoUrl={o.fotoUrl} size="sm" />
              {o.nome}
            </Link>
            {o.tema && <p className="orador-tema">{o.tema}</p>}
            {o.urlDiscurso && (
              <a className="orador-video" href={o.urlDiscurso} target="_blank" rel="noopener noreferrer">
                Assistir ao pronunciamento
              </a>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
