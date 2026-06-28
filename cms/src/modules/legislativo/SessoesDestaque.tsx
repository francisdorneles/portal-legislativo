import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatarData } from '@/lib/format'
import type { SessaoComTipo } from './sessoes.queries'

function statusSessao(dataInicio?: string, hoje = new Date()): { label: string; classe: string } {
  if (!dataInicio) return { label: 'A confirmar', classe: 'prox' }
  const hojeIso = hoje.toISOString().slice(0, 10)
  if (dataInicio === hojeIso) return { label: 'Hoje', classe: 'live' }
  if (dataInicio > hojeIso) return { label: 'Próxima', classe: 'prox' }
  return { label: 'Realizada', classe: 'feita' }
}

/**
 * Bloco "Plenário e Reuniões de Comissões": painel cinza + abas + cards das
 * próximas sessões. Fonte: SAPL (listarProximasSessoes). As abas Comissões e
 * Audiências levam às páginas de cada domínio.
 */
export function SessoesDestaque({ sessoes }: { sessoes: SessaoComTipo[] }) {
  if (sessoes.length === 0) return null
  return (
    <div className="home-sessoes">
      <SectionHeader titulo="Plenário e Reuniões de Comissões" link={{ href: '/sessoes', label: 'Agenda completa →' }} />
      <div className="ses-tabs" role="tablist">
        <span className="on" role="tab" aria-selected="true">Plenário</span>
        <Link role="tab" href="/comissoes">Comissões</Link>
        <Link role="tab" href="/audiencias">Audiências</Link>
      </div>
      <div className="sessoes-cards">
        {sessoes.map((s) => {
          const st = statusSessao(s.data_inicio)
          return (
            <Link key={s.id} className="sessao-card" href={`/sessoes/${s.id}`}>
              <div className="sessao-card__top">
                <span className="sessao-card__cal">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M3 9h18M8 3v4M16 3v4" />
                  </svg>
                  {s.data_inicio ? formatarData(s.data_inicio) : 'A confirmar'}
                </span>
                <span className={`sessao-card__st ${st.classe}`}>{st.label}</span>
              </div>
              <h3>
                {s.numero ? `${s.numero}ª ` : ''}
                {s.tipoNome}
              </h3>
              <div className="sessao-card__h">{s.hora_inicio ? `${s.hora_inicio} · ` : ''}Plenário</div>
              <span className="sessao-card__go">Ver pauta →</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
