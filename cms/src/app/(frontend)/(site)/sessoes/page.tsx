import Link from 'next/link'
import { formatarData } from '@/lib/format'
import { listarSessoes, listarTiposSessao, obterProximaSessao } from '@/modules/legislativo/sessoes.queries'
import { BuscaFiltros } from '@/components/ui/BuscaFiltros'
import { Paginacao } from '@/components/ui/Paginacao'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Sessões') }

type Search = { searchParams: Promise<{ page?: string; tipo?: string; de?: string; ate?: string; q?: string }> }

export default async function SessoesPage({ searchParams }: Search) {
  const { page, tipo, de, ate, q } = await searchParams
  const paginaAtual = Math.max(1, Number(page) || 1)
  const [{ itens, total }, tipos, proxima] = await Promise.all([
    listarSessoes({ page: paginaAtual, tipo, de, ate, q }),
    listarTiposSessao(),
    obterProximaSessao(),
  ])
  const link = (t?: string) => {
    const sp = new URLSearchParams()
    if (t) sp.set('tipo', t)
    if (q) sp.set('q', q)
    if (de) sp.set('de', de)
    if (ate) sp.set('ate', ate)
    const qs = sp.toString()
    return qs ? `/sessoes?${qs}` : '/sessoes'
  }
  const filtrando = Boolean(tipo || de || ate || q)

  return (
    <>
      <h1>Sessões Plenárias</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Pautas, atas, agenda e vídeos das sessões.
      </p>

      <BuscaFiltros basePath="/sessoes" q={q} de={de} ate={ate} placeholderTexto="Buscar por número…" preservar={{ tipo }} />

      {tipos.length > 1 && (
        <div className="chips" role="navigation" aria-label="Filtrar por tipo de sessão">
          <Link href={link()} className={`chip ${!tipo ? 'on' : ''}`}>Todas</Link>
          {tipos.map((t) => (
            <Link key={t.id} href={link(String(t.id))} className={`chip ${tipo === String(t.id) ? 'on' : ''}`}>
              {t.nome}
            </Link>
          ))}
        </div>
      )}

      {proxima && !filtrando && (
        <Link href={`/sessoes/${proxima.id}`} className="card sessao-proxima">
          <span className="badge badge-on">Próxima sessão</span>
          <strong>{proxima.tipoNome}</strong>
          <span className="materia-data">
            {formatarData(proxima.data_inicio)}
            {proxima.hora_inicio ? ` às ${proxima.hora_inicio}` : ''}
          </span>
        </Link>
      )}

      {filtrando && (
        <p style={{ color: 'var(--cinza)' }}>{total} sessão(ões) para o filtro aplicado.</p>
      )}

      {itens.length === 0 ? (
        <p className="vazio">{filtrando ? 'Nenhuma sessão encontrada para o filtro.' : 'Nenhuma sessão cadastrada ainda.'}</p>
      ) : (
        <ul className="materias">
          {itens.map((s) => (
            <li key={s.id}>
              <Link href={`/sessoes/${s.id}`}>
                <div className="materia-top">
                  <span className="materia-id">
                    {s.numero}ª {s.tipoNome}
                  </span>
                  {s.data_fim ? (
                    <span className="badge badge-off">Realizada</span>
                  ) : (
                    <span className="badge badge-on">Agendada</span>
                  )}
                </div>
                <span className="materia-data">
                  {formatarData(s.data_inicio)}
                  {s.hora_inicio ? ` • ${s.hora_inicio}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Paginacao page={paginaAtual} total={total} basePath="/sessoes" params={{ tipo, q, de, ate }} />
    </>
  )
}
