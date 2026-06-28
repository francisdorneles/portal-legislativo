import Link from 'next/link'
import { FileDown } from 'lucide-react'
import { formatarData } from '@/lib/format'
import { listarDocumentos, CATEGORIAS } from '@/modules/institucional/documentos.queries'
import { Paginacao } from '@/components/ui/Paginacao'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Documentos Institucionais') }

type Search = { searchParams: Promise<{ categoria?: string; page?: string }> }

export default async function DocumentosPage({ searchParams }: Search) {
  const { categoria, page } = await searchParams
  const paginaAtual = Math.max(1, Number(page) || 1)
  const { itens, total } = await listarDocumentos({ categoria, page: paginaAtual })

  const link = (cat?: string) => {
    const sp = new URLSearchParams()
    if (cat) sp.set('categoria', cat)
    const qs = sp.toString()
    return qs ? `/documentos?${qs}` : '/documentos'
  }

  return (
    <>
      <h1>Documentos Institucionais</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Regimento interno, lei orgânica, atas, contratos e outros documentos da Câmara.
      </p>

      {/* Filtro por categoria */}
      <div className="chips" role="navigation" aria-label="Filtrar por categoria">
        <Link href={link()} className={`chip ${!categoria ? 'on' : ''}`}>Todos</Link>
        {Object.entries(CATEGORIAS).map(([valor, label]) => (
          <Link key={valor} href={link(valor)} className={`chip ${categoria === valor ? 'on' : ''}`}>
            {label}
          </Link>
        ))}
      </div>

      {itens.length === 0 ? (
        <p className="vazio">
          {categoria ? 'Nenhum documento nesta categoria.' : 'Nenhum documento cadastrado ainda.'}
        </p>
      ) : (
        <ul className="materias">
          {itens.map((d) => (
            <li key={String(d.id)}>
              <div className="materia-top">
                <span className="materia-id">{d.titulo}</span>
                {d.destaque && <span className="badge badge-azul">Destaque</span>}
              </div>
              {d.descricao && <p className="materia-ementa">{d.descricao}</p>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                <span className="materia-data">
                  {CATEGORIAS[d.categoria] ?? d.categoria}
                  {d.dataDocumento ? ` · ${formatarData(d.dataDocumento)}` : ''}
                </span>
                {d.arquivoUrl && (
                  <a
                    href={d.arquivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="orador-video"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <FileDown size={14} />
                    Baixar PDF
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Paginacao page={paginaAtual} total={total} basePath="/documentos" params={{ categoria }} />
    </>
  )
}
