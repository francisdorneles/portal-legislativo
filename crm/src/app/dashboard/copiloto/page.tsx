import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { CopilotoSemana } from '@/components/CopilotoSemana'
import { VigiaDiario } from '@/components/VigiaDiario'
import { PageHeader } from '@/components/ui/primitives'
import { ultimoConteudoIA } from '@/modules/ia/conteudo'
import { agendaDaSemana } from '@/modules/ia/copiloto'
import type { AchadoDiario } from '@/modules/ia/vigia'

export default async function CopilotoPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [agendaSalva, vigiaSalva] = await Promise.all([
    agendaDaSemana(),
    ultimoConteudoIA<AchadoDiario[]>('vigia_diario'),
  ])

  return (
    <div className="p-8">
      <PageHeader
        title="Copiloto"
        subtitle="Onde investir suas horas de rua esta semana — com o porquê de cada escolha."
      />
      <div className="space-y-5">
        <CopilotoSemana inicial={agendaSalva} />
        <VigiaDiario
          inicial={vigiaSalva ? { achados: vigiaSalva.dados ?? [], createdAt: vigiaSalva.createdAt } : null}
        />
      </div>
    </div>
  )
}
