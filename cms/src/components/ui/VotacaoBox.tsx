import Link from 'next/link'
import type { Votacao } from '@/modules/legislativo/votacao.queries'
import { ParlamentarAvatar } from './ParlamentarAvatar'

/** Normaliza o voto para uma classe CSS estável (lida com acentos). */
function classeVoto(voto: string): 'sim' | 'nao' | 'abst' | 'outro' {
  const v = (voto || '').toLowerCase()
  if (v.startsWith('sim')) return 'sim'
  if (v.startsWith('n')) return 'nao' // não
  if (v.startsWith('abs')) return 'abst' // abstenção
  return 'outro'
}

/** Painel de votação: placar + presentes + voto nominal de cada vereador. */
export function VotacaoBox({ votacao, presentes, aberto, titulo }: { votacao: Votacao; presentes: number; aberto?: boolean; titulo?: string }) {
  return (
    <details className="votacao" open={aberto}>
      <summary>
        {titulo && <span className="vot-turno">{titulo}</span>}
        <span className="vot-resultado">{votacao.resultado}</span>
        <span className="vot-placar">
          <span className="vp vp-sim">{votacao.sim} Sim</span>
          <span className="vp vp-nao">{votacao.nao} Não</span>
          <span className="vp vp-abst">{votacao.abstencoes} Abst.</span>
        </span>
        {presentes > 0 && <span className="vot-presentes">{presentes} presentes</span>}
        <span className="vot-toggle" aria-hidden="true" />
      </summary>

      <p className="votos-legenda">Como cada vereador votou nesta matéria:</p>
      <div className="votos-grid">
        {votacao.votos.map((v) => (
          <div className="voto-row" key={v.parlamentarId}>
            <Link href={`/vereadores/${v.parlamentarId}`} className="voto-nome">
              <ParlamentarAvatar nome={v.nome} fotoUrl={v.fotoUrl} size="sm" />
              {v.nome}
            </Link>
            <span className={`voto-badge voto-${classeVoto(v.voto)}`}>{v.voto}</span>
          </div>
        ))}
      </div>
    </details>
  )
}
