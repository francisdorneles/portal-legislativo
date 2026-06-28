import { formatarData } from '@/lib/format'
import { listarDocumentosAdministrativos } from '@/modules/legislativo/protocolo.queries'
import { BuscaFiltros } from '@/components/ui/BuscaFiltros'
import { Paginacao } from '@/components/ui/Paginacao'
import { urlDocumento } from '@/lib/documentos'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Protocolo Administrativo') }

type Search = { searchParams: Promise<{ q?: string; de?: string; ate?: string; page?: string }> }

export default async function ProtocoloPage({ searchParams }: Search) {
  const { q, de, ate, page } = await searchParams
  const paginaAtual = Math.max(1, Number(page) || 1)
  const { itens, total } = await listarDocumentosAdministrativos({ q, de, ate, page: paginaAtual })
  const filtrando = Boolean(q || de || ate)

  return (
    <>
      <h1>Protocolo Administrativo</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Documentos administrativos da Câmara — ofícios, memorandos e portarias. dados oficiais.
        Documentos de acesso restrito não são exibidos.
      </p>

      <BuscaFiltros basePath="/protocolo" q={q} de={de} ate={ate} placeholderTexto="Buscar por assunto…" />

      {filtrando && (
        <p style={{ color: 'var(--cinza)' }}>{total} resultado(s) para o filtro aplicado.</p>
      )}

      {itens.length === 0 ? (
        <p className="vazio">
          {filtrando ? 'Nenhum documento encontrado para o filtro.' : 'Nenhum documento administrativo público ainda.'}
        </p>
      ) : (
        <ul className="materias">
          {itens.map((d) => (
            <li key={d.id}>
              <div className="materia-top">
                <span className="materia-id">{d.titulo}</span>
                {d.emTramitacao && <span className="badge badge-on">Em tramitação</span>}
              </div>
              <p className="materia-ementa">{d.assunto}</p>
              <span className="materia-data">
                {d.interessado ? `Interessado: ${d.interessado} · ` : ''}
                {d.data ? formatarData(d.data) : ''}
              </span>
              {urlDocumento(d.urlDocumento) && (
                <p style={{ margin: '0.5rem 0 0' }}>
                  <a
                    className="orador-video"
                    href={urlDocumento(d.urlDocumento)!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver documento (PDF)
                  </a>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Paginacao page={paginaAtual} total={total} basePath="/protocolo" params={{ q, de, ate }} />
    </>
  )
}
