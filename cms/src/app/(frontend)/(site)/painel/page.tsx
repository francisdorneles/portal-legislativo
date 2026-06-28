import { painelAoVivo } from '@/modules/legislativo/painel.queries'
import { PainelLive } from '@/components/ui/PainelLive'
import { metaTitulo } from '@/lib/meta'

// Painel ao vivo é dinâmico (reflete a sessão em tempo real) — fora do ISR.
export const dynamic = 'force-dynamic'

export async function generateMetadata() { return metaTitulo('Painel Eletrônico') }

export default async function PainelPage() {
  const inicial = await painelAoVivo()

  return (
    <>
      <h1>Painel Eletrônico</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Acompanhe em tempo real a sessão plenária em andamento — item em apreciação,
        presença e progresso da pauta. dados oficiais.
      </p>

      <PainelLive inicial={inicial} />
    </>
  )
}
