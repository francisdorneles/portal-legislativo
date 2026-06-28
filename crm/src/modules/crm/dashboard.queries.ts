import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import type { StatusDemanda } from '@prisma/client'
import { temperatura, type Temperatura } from './relacionamento'

/** Números e itens recentes do gabinete da sessão para a visão geral. Tudo isolado. */
export async function estatisticasDashboard() {
  const session = await auth()
  if (!session) throw new Error('não autenticado')

  return withTenant(session.tenant, async () => {
    const [cidadaos, porStatus, recentes, contatos] = await Promise.all([
      prisma.cidadao.count(),
      prisma.demanda.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.demanda.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { cidadao: { select: { nome: true } } },
      }),
      prisma.cidadao.findMany({ select: { id: true, nome: true, ultimoContato: true } }),
    ])

    const demandas: Record<StatusDemanda, number> = {
      ABERTA: 0, EM_ANDAMENTO: 0, ENCAMINHADA: 0, RESOLVIDA: 0,
    }
    for (const g of porStatus) demandas[g.status] = g._count._all
    const totalDemandas = Object.values(demandas).reduce((a, b) => a + b, 0)

    // termômetro de relacionamento
    const relacionamento: Record<Temperatura, number> = { quente: 0, esfriando: 0, frio: 0 }
    const agora = new Date()
    for (const c of contatos) relacionamento[temperatura(c.ultimoContato, agora)]++
    const precisamAtencao = contatos
      .filter((c) => temperatura(c.ultimoContato, agora) === 'frio')
      .slice(0, 5)

    return { cidadaos, demandas, totalDemandas, recentes, relacionamento, precisamAtencao }
  })
}
