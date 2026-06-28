import Link from 'next/link'
import type { Vereador } from '@/modules/legislativo/parlamentares.queries'
import { PartidoLogo } from './PartidoLogo'

export function VereadorCard({ vereador }: { vereador: Vereador }) {
  return (
    <Link className="pessoa" href={`/vereadores/${vereador.id}`}>
      <div className="avatar">
        {vereador.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vereador.fotoUrl} alt={vereador.nome_parlamentar} />
        ) : (
          <span aria-hidden="true">{(vereador.nome_parlamentar ?? '?').charAt(0)}</span>
        )}
      </div>
      <h3>{vereador.nome_parlamentar}</h3>
      {vereador.suplente && (
        <span className="badge badge-suplente">Suplente convocado</span>
      )}
      {vereador.partidoSigla && (
        <span className="partido">
          <PartidoLogo sigla={vereador.partidoSigla} />
        </span>
      )}
    </Link>
  )
}
