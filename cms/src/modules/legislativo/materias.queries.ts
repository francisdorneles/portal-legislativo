import { sapl, saplFetch, type MateriaLegislativa } from './sapl.client'

export interface MateriasResultado {
  itens: MateriaLegislativa[]
  total: number
}

/**
 * Lista matérias legislativas (projetos) do SAPL, mais recentes primeiro.
 * `q` filtra por ementa/número no servidor (filtro simples; a busca full-text
 * via Solr fica como evolução da Fase 3).
 */
/** Tipos de matéria (PL, Decreto, Requerimento…) para o filtro. Fonte: SAPL. */
export async function listarTiposMateria() {
  try {
    const res = await sapl.tiposMateria('?page=1')
    return (res.results ?? []).map((t) => ({ id: t.id, sigla: t.sigla, descricao: t.descricao }))
  } catch {
    return []
  }
}

export async function listarMaterias(
  opts: { page?: number; q?: string; tipo?: string; de?: string; ate?: string } = {},
): Promise<MateriasResultado> {
  try {
    const page = opts.page ?? 1
    const p = new URLSearchParams({ page: String(page) })
    if (opts.tipo) p.set('tipo', opts.tipo)
    if (opts.q?.trim()) p.set('ementa__icontains', opts.q.trim())
    if (opts.de) p.set('data_apresentacao__gte', opts.de)
    if (opts.ate) p.set('data_apresentacao__lte', opts.ate)

    const res = await sapl.materias(`?${p.toString()}`)
    const itens = [...(res.results ?? [])].sort(
      (a, b) => Number(b.ano ?? 0) - Number(a.ano ?? 0) || Number(b.numero ?? 0) - Number(a.numero ?? 0),
    )
    return { itens, total: res.pagination?.total_entries ?? itens.length }
  } catch {
    return { itens: [], total: 0 }
  }
}

/** Uma matéria legislativa pelo id, ou null. */
export async function obterMateria(id: number): Promise<MateriaLegislativa | null> {
  try {
    return await saplFetch<MateriaLegislativa>(`/api/materia/materialegislativa/${id}/`)
  } catch {
    return null
  }
}
