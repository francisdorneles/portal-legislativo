import { sapl } from './sapl.client'

/** Legislatura já formatada para a UI, com período e marcação da atual. */
export interface LegislaturaItem {
  id: number
  numero: number
  dataInicio?: string
  dataFim?: string
  dataEleicao?: string
  atual: boolean
  /** Quantos parlamentares tiveram mandato nesta legislatura. */
  parlamentares: number
}

/**
 * Lista as legislaturas (períodos de mandato da Casa), mais recentes primeiro,
 * marcando a que está em curso na data de hoje e contando os parlamentares de
 * cada uma (via mandatos). Fonte: SAPL.
 */
export async function listarLegislaturas(hoje = new Date()): Promise<LegislaturaItem[]> {
  try {
    const [legRes, mandRes] = await Promise.all([
      sapl.legislaturas('?page=1'),
      sapl.mandatos('?page=1'),
    ])
    const hojeIso = hoje.toISOString().slice(0, 10)

    // Conta parlamentares distintos por legislatura.
    const porLegislatura = new Map<number, Set<number>>()
    for (const m of mandRes.results ?? []) {
      const leg = (m as { legislatura?: number }).legislatura
      const parl = (m as { parlamentar?: number }).parlamentar
      if (leg == null) continue
      if (!porLegislatura.has(leg)) porLegislatura.set(leg, new Set())
      if (parl != null) porLegislatura.get(leg)!.add(parl)
    }

    return (legRes.results ?? [])
      .map((l) => ({
        id: l.id,
        numero: l.numero,
        dataInicio: l.data_inicio,
        dataFim: l.data_fim,
        dataEleicao: l.data_eleicao,
        atual: (l.data_inicio ?? '') <= hojeIso && hojeIso <= (l.data_fim ?? ''),
        parlamentares: porLegislatura.get(l.id)?.size ?? 0,
      }))
      .sort((a, b) => b.numero - a.numero)
  } catch {
    return []
  }
}
