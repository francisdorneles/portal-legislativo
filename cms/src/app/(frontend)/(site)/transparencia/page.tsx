import Link from 'next/link'
import { obterConfigCamara } from '@/lib/camara'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { metaTitulo } from '@/lib/meta'

export async function generateMetadata() { return metaTitulo('Transparência') }

export default async function TransparenciaPage() {
  const cfg = await obterConfigCamara()

  return (
    <ArtigoLayout titulo="Portal da Transparência">
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Acesso aos sistemas oficiais de transparência, contas públicas e pedidos de informação.
      </p>

      <h2 className="sec-titulo">Transparência ativa</h2>
      <ul className="materias">
        <li>
          <Link href="/transparencia/pedidos-lai">
            <span className="materia-id">Pedidos de Informação (LAI) e Ouvidoria</span>
            <p className="materia-ementa">Relatório agregado das manifestações recebidas e respondidas.</p>
          </Link>
        </li>
      </ul>

      {cfg.transparenciaLinks.length === 0 ? (
        <>
          <h2 style={{ marginTop: '1.5rem' }} className="sec-titulo">Sistemas oficiais</h2>
          <p className="vazio">
            Os links para despesas, receitas, licitações, folha, balanços e contas públicas
            serão exibidos aqui. Cadastre-os no admin (Configurações da Câmara → Links de
            transparência), escolhendo o bloco de cada um.
          </p>
        </>
      ) : (
        BLOCOS.filter((bloco) => cfg.transparenciaLinks.some((l) => (l.categoria ?? 'sistemas') === bloco.id)).map(
          (bloco) => (
            <section key={bloco.id}>
              <h2 className="sec-titulo">{bloco.titulo}</h2>
              <ul className="materias">
                {cfg.transparenciaLinks
                  .filter((l) => (l.categoria ?? 'sistemas') === bloco.id)
                  .map((l) => (
                    <li key={l.href}>
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        <span className="materia-id">{l.titulo} ↗</span>
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          ),
        )
      )}
    </ArtigoLayout>
  )
}

/** Blocos da transparência, na ordem de exibição. */
const BLOCOS = [
  { id: 'sistemas', titulo: 'Sistemas oficiais' },
  { id: 'funcionais', titulo: 'Informações funcionais' },
  { id: 'despesas', titulo: 'Despesas e empenhos' },
  { id: 'demonstrativos', titulo: 'Demonstrativos contábeis' },
  { id: 'patrimonio', titulo: 'Patrimônio' },
  { id: 'contratos', titulo: 'Licitações e contratos' },
  { id: 'dados', titulo: 'Dados abertos' },
]
