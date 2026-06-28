import { formatarData } from '@/lib/format'
import { listarAudiencias } from '@/modules/legislativo/audiencias.queries'
import { BuscaFiltros } from '@/components/ui/BuscaFiltros'
import { Paginacao } from '@/components/ui/Paginacao'
import { urlDocumento } from '@/lib/documentos'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Audiências Públicas') }

type Search = { searchParams: Promise<{ page?: string; q?: string; de?: string; ate?: string }> }

export default async function AudienciasPage({ searchParams }: Search) {
  const { page, q, de, ate } = await searchParams
  const paginaAtual = Math.max(1, Number(page) || 1)
  const { itens: audiencias, total } = await listarAudiencias({ q, de, ate, page: paginaAtual })
  const filtrando = Boolean(q || de || ate)

  return (
    <>
      <h1>Audiências Públicas</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Espaços de participação popular.
      </p>

      <BuscaFiltros basePath="/audiencias" q={q} de={de} ate={ate} placeholderTexto="Buscar por nome…" />

      {filtrando && (
        <p style={{ color: 'var(--cinza)' }}>{total} resultado(s) para o filtro aplicado.</p>
      )}

      {audiencias.length === 0 ? (
        <p className="vazio">{filtrando ? 'Nenhuma audiência encontrada para o filtro.' : 'Nenhuma audiência pública cadastrada ainda.'}</p>
      ) : (
        <ul className="materias">
          {audiencias.map((a) => (
            <li key={a.id}>
              <div className="materia-top">
                <span className="materia-id">{a.nome}</span>
                {a.audiencia_cancelada && <span className="badge badge-off">Cancelada</span>}
              </div>
              {a.tema && <p className="materia-ementa">{a.tema}</p>}
              <span className="materia-data">
                {formatarData(a.data)}
                {a.hora_inicio ? ` • ${a.hora_inicio}` : ''}
              </span>
              {(urlDocumento(a.upload_pauta) || urlDocumento(a.upload_ata) || a.url_video) && (
                <p className="audiencia-docs">
                  {urlDocumento(a.upload_pauta) && <a href={urlDocumento(a.upload_pauta)!} target="_blank" rel="noopener noreferrer">Pauta</a>}
                  {urlDocumento(a.upload_ata) && <a href={urlDocumento(a.upload_ata)!} target="_blank" rel="noopener noreferrer">Ata</a>}
                  {a.url_video && <a href={a.url_video} target="_blank" rel="noopener noreferrer">Vídeo</a>}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Paginacao page={paginaAtual} total={total} basePath="/audiencias" params={{ q, de, ate }} />
    </>
  )
}
