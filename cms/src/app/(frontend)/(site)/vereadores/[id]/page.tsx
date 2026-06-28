import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { obterVereador, type MandatoHistorico } from '@/modules/legislativo/parlamentares.queries'
import { comissoesDoVereador } from '@/modules/legislativo/comissoes.queries'
import { nomeCurto } from '@/lib/meta'
import { PerfilTabs, type PerfilTab } from '@/components/ui/PerfilTabs'

export const revalidate = 3600

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const [v, sf] = await Promise.all([obterVereador(Number(id)), nomeCurto()])
  return { title: v ? `${v.nome_parlamentar} — ${sf}` : 'Vereador não encontrado' }
}

const ORDINAIS = ['1º','2º','3º','4º','5º','6º','7º','8º','9º','10º']
function ordinal(n: number): string {
  return ORDINAIS[n - 1] ?? `${n}º`
}

export default async function VereadorPage({ params }: Params) {
  const { id } = await params
  const v = await obterVereador(Number(id))
  if (!v) notFound()

  const comissoes = await comissoesDoVereador(v.id)
  const mandatos = v.mandatosHistorico ?? []
  const totalMandatos = mandatos.length

  const tabs: PerfilTab[] = [
    {
      id: 'sobre',
      label: 'Sobre',
      conteudo: (
        <>
          {v.profissao && (
            <p className="perfil-profissao-bio">
              <strong>Profissão:</strong> {v.profissao}
            </p>
          )}
          {v.biografia ? (
            <div className="perfil-bio" dangerouslySetInnerHTML={{ __html: v.biografia }} />
          ) : (
            <p className="vazio">Sem biografia cadastrada.</p>
          )}
        </>
      ),
    },
    {
      id: 'mandatos',
      label: 'Mandatos',
      badge: totalMandatos || undefined,
      conteudo:
        totalMandatos > 0 ? (
          <ul className="perfil-comissoes">
            {mandatos.map((m: MandatoHistorico, i: number) => (
              <li key={m.id}>
                <div className="pc-link-com-foto">
                  <span aria-hidden="true" style={{ flex: '0 0 auto' }}>
                    <span className="badge badge-azul" style={{ display: 'inline-block', minWidth: 40, textAlign: 'center', fontSize: '1rem', fontWeight: 800 }}>
                      {ordinal(totalMandatos - i)}
                    </span>
                  </span>
                  <span>
                    <span className="pc-nome">
                      {m.legislaturaLabel}
                      {m.votos != null && (
                        <span className="pmi-votos-inline">
                          {' · '}
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {m.votos.toLocaleString('pt-BR')}
                          </span>
                          {' votos'}
                        </span>
                      )}
                    </span>
                    <span className="pc-tipo">{m.titular ? 'Titular' : 'Suplente'}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vazio">Nenhum mandato registrado.</p>
        ),
    },
    {
      id: 'atuacao',
      label: 'Atuação',
      conteudo: (
        <p className="vazio">
          Projetos de autoria e votações serão exibidos aqui.
        </p>
      ),
    },
    {
      id: 'comissoes',
      label: 'Comissões',
      badge: comissoes.length || undefined,
      conteudo:
        comissoes.length > 0 ? (
          <ul className="perfil-comissoes">
            {comissoes.map((c) => (
              <li key={c.id}>
                <Link href={`/comissoes/${c.id}`} className="pc-link-com-foto">
                  <span aria-hidden="true" style={{ flex: '0 0 auto' }}>
                    <span className="badge badge-azul" style={{ display: 'inline-block', minWidth: 40, textAlign: 'center' }}>
                      {c.sigla ?? ''}
                    </span>
                  </span>
                  <span>
                    <span className="pc-nome">{c.nome}</span>
                    <span className="pc-tipo">{c.cargo}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vazio">Não participa de comissões no momento.</p>
        ),
    },
  ]

  return (
    <article className="perfil-card perfil-dossie">
        <div className="pd-corpo">
          <div className="pd-foto-col">
            <div className="pd-foto">
              {v.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.fotoUrl} alt={v.nome_parlamentar} />
              ) : (
                <span className="pd-foto-inicial" aria-hidden="true">
                  {(v.nome_parlamentar ?? '?').charAt(0)}
                </span>
              )}
            </div>
          </div>

          <div className="pd-info">
            <h1 className="pd-nome">
              {v.nome_parlamentar}
              {v.partidoSigla && <span className="pd-chip-partido">{v.partidoSigla}</span>}
            </h1>

            {v.nome_completo && v.nome_completo !== v.nome_parlamentar && (
              <p className="pd-nome-completo">{v.nome_completo}</p>
            )}

            {totalMandatos > 0 && (
              <div className="pd-pills">
                <span className="pd-pill pd-pill--mandato">{ordinal(totalMandatos)} mandato</span>
                <span className={`pd-pill${v.suplente ? ' pd-pill--suplente' : ' pd-pill--titular'}`}>
                  {v.suplente ? 'Suplente convocado' : 'Titular'}
                </span>
              </div>
            )}

            {(v.estatisticas?.projetos != null || v.estatisticas?.votacoes != null || v.estatisticas?.presencaPercent != null) && (
              <div className="pd-stats">
                {v.estatisticas.projetos != null && (
                  <div>
                    <strong>{v.estatisticas.projetos.toLocaleString('pt-BR')}</strong>
                    <span>projetos de autoria</span>
                  </div>
                )}
                {v.estatisticas.votacoes != null && (
                  <div>
                    <strong>{v.estatisticas.votacoes.toLocaleString('pt-BR')}</strong>
                    <span>votações</span>
                  </div>
                )}
                {v.estatisticas.presencaPercent != null && (
                  <div>
                    <strong>{v.estatisticas.presencaPercent}%</strong>
                    <span>presença em sessões</span>
                  </div>
                )}
              </div>
            )}

            {(v.email || v.telefone || v.numero_gab_parlamentar) && (
              <ul className="pd-contatos">
                {v.email && (
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amarelo)" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
                    </svg>
                    <a href={`mailto:${v.email}`}>{v.email}</a>
                  </li>
                )}
                {v.telefone && (
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amarelo)" strokeWidth="2" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <a href={`tel:${v.telefone.replace(/\D/g, '')}`}>{v.telefone}</a>
                  </li>
                )}
                {v.numero_gab_parlamentar && (
                  <li>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amarelo)" strokeWidth="2" aria-hidden="true">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    Gabinete {v.numero_gab_parlamentar}
                  </li>
                )}
              </ul>
            )}

            <PerfilTabs tabs={tabs} />
          </div>
        </div>
      </article>
  )
}
