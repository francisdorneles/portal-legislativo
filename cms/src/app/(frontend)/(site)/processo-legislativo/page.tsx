import Link from 'next/link'
import { formatarData } from '@/lib/format'
import { listarMaterias, listarTiposMateria } from '@/modules/legislativo/materias.queries'
import { BuscaFiltros } from '@/components/ui/BuscaFiltros'
import { Paginacao } from '@/components/ui/Paginacao'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Processo Legislativo') }

type Search = { searchParams: Promise<{ q?: string; tipo?: string; de?: string; ate?: string; page?: string }> }

export default async function ProcessoLegislativoPage({ searchParams }: Search) {
  const { q, tipo, de, ate, page } = await searchParams
  const paginaAtual = Math.max(1, Number(page) || 1)
  const [{ itens, total }, tipos] = await Promise.all([
    listarMaterias({ q, tipo, de, ate, page: paginaAtual }),
    listarTiposMateria(),
  ])
  const link = (t?: string) => {
    const sp = new URLSearchParams()
    if (t) sp.set('tipo', t)
    if (q) sp.set('q', q)
    if (de) sp.set('de', de)
    if (ate) sp.set('ate', ate)
    const qs = sp.toString()
    return qs ? `/processo-legislativo?${qs}` : '/processo-legislativo'
  }
  const filtrando = Boolean(q || de || ate)

  return (
    <>
      <h1>Processo Legislativo</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Projetos de lei e proposições em tramitação.
      </p>

      <BuscaFiltros
        basePath="/processo-legislativo"
        q={q}
        de={de}
        ate={ate}
        placeholderTexto="Buscar por ementa…"
        preservar={{ tipo }}
      />

      {tipos.length > 0 && (
        <div className="chips" role="navigation" aria-label="Filtrar por tipo">
          <Link href={link()} className={`chip ${!tipo ? 'on' : ''}`}>Todos</Link>
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
        <p className="vazio">
          {filtrando ? 'Nenhum projeto encontrado para o filtro.' : 'Nenhuma matéria cadastrada ainda.'}
        </p>
      ) : (
        <ul className="materias">
          {itens.map((m) => (
            <li key={m.id}>
              <Link href={`/processo-legislativo/${m.id}`}>
                <div className="materia-top">
                  <span className="materia-id">{m.__str__}</span>
                  <span className={`badge ${m.em_tramitacao ? 'badge-on' : 'badge-off'}`}>
                    {m.em_tramitacao ? 'Em tramitação' : 'Encerrado'}
                  </span>
                </div>
                <p className="materia-ementa">{m.ementa}</p>
                <span className="materia-data">Apresentado em {formatarData(m.data_apresentacao)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Paginacao page={paginaAtual} total={total} basePath="/processo-legislativo" params={{ tipo, q, de, ate }} />
    </>
  )
}
