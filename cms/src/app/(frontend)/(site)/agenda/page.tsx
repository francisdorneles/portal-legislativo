import Link from 'next/link'
import { formatarData } from '@/lib/format'
import { eventosAgenda } from '@/modules/legislativo/agenda.queries'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Agenda Oficial') }

type Search = { searchParams: Promise<{ ver?: string }> }

export default async function AgendaPage({ searchParams }: Search) {
  const { ver } = await searchParams
  const incluirPassado = ver === 'todos'
  const eventos = await eventosAgenda({ incluirPassado })

  return (
    <>
      <h1>Agenda Oficial</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Sessões plenárias e audiências públicas.
      </p>

      <div className="chips" role="navigation" aria-label="Período da agenda">
        <Link href="/agenda" className={`chip ${!incluirPassado ? 'on' : ''}`}>Próximos</Link>
        <Link href="/agenda?ver=todos" className={`chip ${incluirPassado ? 'on' : ''}`}>Todos</Link>
      </div>

      {eventos.length === 0 ? (
        <p className="vazio">
          {incluirPassado ? 'Nenhum compromisso na agenda.' : 'Nenhum compromisso futuro agendado.'}
        </p>
      ) : (
        <ul className="agenda">
          {eventos.map((e) => (
            <li key={e.id} className={e.passado ? 'passado' : ''}>
              <div className="agenda-data">
                <strong>{formatarData(e.data)}</strong>
                {e.hora && <span>{e.hora}</span>}
              </div>
              <div className="agenda-corpo">
                {e.cancelado ? (
                  <span className="badge badge-off">Cancelado</span>
                ) : e.tipo === 'sessao' ? (
                  <span className="badge badge-on">Sessão</span>
                ) : (
                  <span className="badge badge-azul">Audiência Pública</span>
                )}
                <Link href={e.href} className="agenda-titulo">{e.titulo}</Link>
                {e.subtitulo && (
                  <span className="materia-ementa" style={{ display: 'block', marginTop: '0.2rem' }}>
                    {e.subtitulo}
                  </span>
                )}
                {e.horaFim && e.hora && (
                  <span className="materia-data"> até {e.horaFim}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
