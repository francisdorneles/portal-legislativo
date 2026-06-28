import { sapl, saplFetch, type NormaJuridica } from './sapl.client'

/** Uma norma vinculada a outra, já com rótulo legível e resumo do vínculo. */
export interface RelacaoNorma {
  id: number
  /** Rótulo do vínculo na direção certa (ex.: "Altera o(a)" / "Revogado(a) parcialmente pelo(a)"). */
  rotulo: string
  resumo?: string
  /** A norma do outro lado do vínculo, ou null se não localizada. */
  norma: { id: number; numero?: string; ano?: number; ementa?: string } | null
}

/** Vínculos de uma norma: ativos (ela age sobre outra) e passivos (outra age sobre ela). */
export interface RelacoesNorma {
  ativas: RelacaoNorma[]
  passivas: RelacaoNorma[]
}

export interface NormasResultado {
  itens: NormaJuridica[]
  total: number
}

/** Tipos de norma (Lei, Decreto Legislativo, Resolução…) para o filtro. Fonte: SAPL. */
export async function listarTiposNorma(): Promise<{ id: number; sigla: string; descricao: string }[]> {
  try {
    const res = await saplFetch<{ results?: { id: number; sigla: string; descricao: string }[] }>(
      `/api/norma/tiponormajuridica/?page=1`,
    )
    return (res.results ?? []).map((t) => ({ id: t.id, sigla: t.sigla, descricao: t.descricao }))
  } catch {
    return []
  }
}

/** Lista normas jurídicas (leis/decretos) do SAPL, mais recentes primeiro. */
export async function listarNormas(
  opts: { page?: number; q?: string; tipo?: string; de?: string; ate?: string } = {},
): Promise<NormasResultado> {
  try {
    const page = opts.page ?? 1
    const p = new URLSearchParams({ page: String(page) })
    if (opts.tipo) p.set('tipo', opts.tipo)
    if (opts.q?.trim()) p.set('ementa__icontains', opts.q.trim())
    if (opts.de) p.set('data__gte', opts.de)
    if (opts.ate) p.set('data__lte', opts.ate)

    const res = await sapl.normas(`?${p.toString()}`)
    const itens = [...(res.results ?? [])].sort(
      (a, b) => Number(b.ano ?? 0) - Number(a.ano ?? 0) || Number(b.numero ?? 0) - Number(a.numero ?? 0),
    )
    return { itens, total: res.pagination?.total_entries ?? itens.length }
  } catch {
    return { itens: [], total: 0 }
  }
}

/** A norma (lei) originada de uma matéria/projeto, ou null. Fonte: SAPL. */
export async function normaDaMateria(materiaId: number): Promise<NormaJuridica | null> {
  try {
    const res = await sapl.normas(`?materia=${materiaId}`)
    return res.results?.[0] ?? null
  } catch {
    return null
  }
}

/** Uma norma pelo id, ou null. */
export async function obterNorma(id: number): Promise<NormaJuridica | null> {
  try {
    return await saplFetch<NormaJuridica>(`/api/norma/normajuridica/${id}/`)
  } catch {
    return null
  }
}

/**
 * Relações de uma norma com outras (altera/revoga/regulamenta/correlata).
 * Junta os vínculos (NormaRelacionada) com os tipos de vínculo (rótulo ativo/
 * passivo) e com o resumo das normas do outro lado. Fonte: SAPL.
 */
export async function relacoesDaNorma(normaId: number): Promise<RelacoesNorma> {
  const vazio: RelacoesNorma = { ativas: [], passivas: [] }
  try {
    const [relRes, tiposRes, normasRes] = await Promise.all([
      sapl.normasRelacionadas('?page=1'),
      sapl.tiposVinculoNorma('?page=1'),
      sapl.normas('?page=1'),
    ])
    const relacoes = relRes.results ?? []
    const tipos = new Map(
      (tiposRes.results ?? []).map((t) => [
        t.id,
        { ativa: t.descricao_ativa ?? '', passiva: t.descricao_passiva ?? '' },
      ]),
    )
    const normas = new Map((normasRes.results ?? []).map((n) => [n.id, n]))

    const resumoNorma = (id?: number) => {
      const n = id != null ? normas.get(id) : undefined
      if (!n) return null
      return { id: n.id, numero: n.numero, ano: n.ano, ementa: n.ementa }
    }

    const ativas: RelacaoNorma[] = []
    const passivas: RelacaoNorma[] = []
    for (const r of relacoes) {
      const t = tipos.get(r.tipo_vinculo)
      if (r.norma_principal === normaId) {
        ativas.push({
          id: r.id,
          rotulo: t?.ativa ?? 'Relacionada a',
          resumo: r.resumo || undefined,
          norma: resumoNorma(r.norma_relacionada),
        })
      } else if (r.norma_relacionada === normaId) {
        passivas.push({
          id: r.id,
          rotulo: t?.passiva ?? 'Relacionada a',
          resumo: r.resumo || undefined,
          norma: resumoNorma(r.norma_principal),
        })
      }
    }
    return { ativas, passivas }
  } catch {
    return vazio
  }
}
