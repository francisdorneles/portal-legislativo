import Link from 'next/link'
import { formatarData } from '@/lib/format'
import { listarNormas, listarTiposNorma } from '@/modules/legislativo/normas.queries'
import { BuscaFiltros } from '@/components/ui/BuscaFiltros'
import { Paginacao } from '@/components/ui/Paginacao'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Legislação') }

type Search = { searchParams: Promise<{ q?: string; tipo?: string; de?: string; ate?: string; page?: string }> }

export default async function LegislacaoPage({ searchParams }: Search) {
  const { q, tipo, de, ate, page } = await searchParams
  const paginaAtual = Math.max(1, Number(page) || 1)
  const [{ itens, total }, tipos] = await Promise.all([
    listarNormas({ q, tipo, de, ate, page: paginaAtual }),
    listarTiposNorma(),
  ])
  const link = (t?: string) => {
    const sp = new URLSearchParams()
    if (t) sp.set('tipo', t)
    if (q) sp.set('q', q)
    if (de) sp.set('de', de)
    if (ate) sp.set('ate', ate)
    const qs = sp.toString()
    return qs ? `/legislacao?${qs}` : '/legislacao'
  }
  const filtrando = Boolean(q || de || ate)

  return (
    <>
      <h1>Legislação</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Leis e normas municipais.
      </p>

      <BuscaFiltros
        basePath="/legislacao"
        q={q}
        de={de}
        ate={ate}
        placeholderTexto="Buscar por ementa…"
        preservar={{ tipo }}
      />

      {tipos.length > 1 && (
        <div className="chips" role="navigation" aria-label="Filtrar por tipo de norma">
          <Link href={link()} className={`chip ${!tipo ? 'on' : ''}`}>Todas</Link>
          {tipos.map((t) => (
            <Link key={t.id} href={link(String(t.id))} className={`chip ${tipo === String(t.id) ? 'on' : ''}`}>
              {t.descricao}
            </Link>
          ))}
        </div>
      )}

      {filtrando && (
        <p style={{ color: 'var(--cinza)' }}>{total} resultado(s) para o filtro aplicado.</p>
      )}

      {itens.length === 0 ? (
        <p className="vazio">{filtrando ? 'Nenhuma norma encontrada.' : 'Nenhuma norma cadastrada ainda.'}</p>
      ) : (
        <ul className="materias">
          {itens.map((n) => (
            <li key={n.id}>
              <Link href={`/legislacao/${n.id}`}>
                <div className="materia-top">
                  <span className="materia-id">{n.__str__}</span>
                </div>
                <p className="materia-ementa">{n.ementa}</p>
                <span className="materia-data">Publicada em {formatarData(n.data)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Paginacao page={paginaAtual} total={total} basePath="/legislacao" params={{ tipo, q, de, ate }} />
    </>
  )
}
