import Link from 'next/link'
import { estatisticasLai } from '@/modules/ouvidoria/manifestacoes.queries'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Pedidos de Informação (LAI)') }

export default async function PedidosLaiPage() {
  const e = await estatisticasLai()

  return (
    <ArtigoLayout
      titulo="Pedidos de Informação e Manifestações"
      prelude={<Link href="/transparencia" className="voltar">← Transparência</Link>}
    >
      <p style={{ color: 'var(--cinza)' }}>
        Transparência ativa sobre os pedidos recebidos pelo e-SIC (LAI) e pela Ouvidoria. Os dados
        são agregados — nenhuma informação pessoal do solicitante é divulgada.
      </p>

      <div className="indicadores">
        <div className="indicador"><strong>{e.total}</strong><span>Total de manifestações</span></div>
        <div className="indicador"><strong>{e.esic}</strong><span>Pedidos e-SIC (LAI)</span></div>
        <div className="indicador"><strong>{e.ouvidoria}</strong><span>Ouvidoria</span></div>
        <div className="indicador"><strong>{e.respondidasPct}%</strong><span>Respondidas</span></div>
      </div>

      <h2 className="sec-titulo">Situação</h2>
      <dl className="ficha">
        <div><dt>Recebidas</dt><dd>{e.porStatus.recebido}</dd></div>
        <div><dt>Em andamento</dt><dd>{e.porStatus.andamento}</dd></div>
        <div><dt>Respondidas</dt><dd>{e.porStatus.respondido}</dd></div>
      </dl>

      {e.total === 0 && (
        <p className="vazio">Ainda não há manifestações registradas no período.</p>
      )}

      <p style={{ color: 'var(--cinza)', fontSize: '0.9rem', marginTop: '1.5rem' }}>
        Para fazer um pedido, use o <Link href="/sic">e-SIC</Link> ou a{' '}
        <Link href="/ouvidoria">Ouvidoria</Link>.
      </p>
    </ArtigoLayout>
  )
}
