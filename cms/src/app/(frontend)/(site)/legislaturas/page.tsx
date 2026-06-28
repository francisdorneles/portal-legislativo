import Link from 'next/link'
import { formatarData } from '@/lib/format'
import { listarLegislaturas } from '@/modules/legislativo/legislaturas.queries'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Legislaturas') }

export default async function LegislaturasPage() {
  const legislaturas = await listarLegislaturas()

  return (
    <>
      <h1>Legislaturas</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Períodos de mandato da Câmara — composições ao longo do tempo. dados oficiais.
      </p>

      {legislaturas.length === 0 ? (
        <p className="vazio">Nenhuma legislatura cadastrada ainda.</p>
      ) : (
        <ul className="materias">
          {legislaturas.map((l) => (
            <li key={l.id}>
              <div className="materia-top">
                <span className="materia-id">{l.numero}ª Legislatura</span>
                {l.atual && <span className="badge badge-on">Atual</span>}
              </div>
              <p className="materia-ementa">
                {formatarData(l.dataInicio)} a {formatarData(l.dataFim)}
                {l.parlamentares > 0 && ` • ${l.parlamentares} parlamentares`}
              </p>
              {l.dataEleicao && (
                <span className="materia-data">Eleição em {formatarData(l.dataEleicao)}</span>
              )}
              {l.atual && (
                <p style={{ margin: '0.6rem 0 0' }}>
                  <Link className="orador-video" href="/vereadores">
                    Ver vereadores em exercício
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
