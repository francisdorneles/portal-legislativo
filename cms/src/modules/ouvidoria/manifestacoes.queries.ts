import { getPayloadClient } from '@/lib/payload'

export interface EstatisticasLai {
  total: number
  esic: number
  ouvidoria: number
  porStatus: { recebido: number; andamento: number; respondido: number }
  respondidasPct: number
}

type Doc = { tipo?: string; status?: string }

/**
 * Estatísticas agregadas de pedidos (e-SIC) e manifestações (Ouvidoria) para o
 * relatório público de transparência ativa. NÃO expõe dado pessoal — só contagens.
 */
export async function estatisticasLai(): Promise<EstatisticasLai> {
  const base: EstatisticasLai = {
    total: 0, esic: 0, ouvidoria: 0,
    porStatus: { recebido: 0, andamento: 0, respondido: 0 },
    respondidasPct: 0,
  }
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'manifestacoes',
      overrideAccess: true,
      limit: 1000,
      depth: 0,
    })
    const itens = docs as Doc[]
    base.total = itens.length
    for (const m of itens) {
      if (m.tipo === 'esic') base.esic++
      else if (m.tipo === 'ouvidoria') base.ouvidoria++
      if (m.status === 'andamento') base.porStatus.andamento++
      else if (m.status === 'respondido') base.porStatus.respondido++
      else base.porStatus.recebido++
    }
    base.respondidasPct = base.total ? Math.round((base.porStatus.respondido / base.total) * 100) : 0
    return base
  } catch {
    return base
  }
}
