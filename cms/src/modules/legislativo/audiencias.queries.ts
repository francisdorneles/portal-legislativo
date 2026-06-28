import { sapl, type AudienciaPublica } from './sapl.client'

export interface AudienciasResultado {
  itens: AudienciaPublica[]
  total: number
}

/** Audiências públicas, mais recentes primeiro. Filtra por nome/data se informado. Fonte: SAPL. */
export async function listarAudiencias(
  opts: { page?: number; q?: string; de?: string; ate?: string } = {},
): Promise<AudienciasResultado> {
  try {
    const page = opts.page ?? 1
    const p = new URLSearchParams({ page: String(page) })
    if (opts.q?.trim()) p.set('nome__icontains', opts.q.trim())
    if (opts.de) p.set('data__gte', opts.de)
    if (opts.ate) p.set('data__lte', opts.ate)
    const res = await sapl.audiencias(`?${p.toString()}`)
    const itens = (res.results ?? []).sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
    return { itens, total: res.pagination?.total_entries ?? itens.length }
  } catch {
    return { itens: [], total: 0 }
  }
}
