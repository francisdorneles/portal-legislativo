import { sapl, saplFetch, type Comissao, type Parlamentar } from './sapl.client'
import { urlDocumento } from '@/lib/documentos'

/** Membro de comissão com nome do parlamentar e cargo resolvidos. */
export interface MembroComissao {
  parlamentarId: number
  nome: string
  cargo: string
  fotoUrl: string | null
}

/** Comissão de que um vereador participa (para o perfil). */
export interface ComissaoDoVereador {
  id: number
  nome: string
  sigla: string
  cargo: string
}

/** Comissões ativas. Fonte: SAPL. */
export async function listarComissoes(): Promise<Comissao[]> {
  try {
    const res = await sapl.comissoes('?page=1')
    return (res.results ?? [])
      .filter((c) => c.ativa !== false)
      .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''))
  } catch {
    return []
  }
}

/** Uma comissão pelo id, ou null. */
export async function obterComissao(id: number): Promise<Comissao | null> {
  try {
    return await saplFetch<Comissao>(`/api/comissoes/comissao/${id}/`)
  } catch {
    return null
  }
}

async function mapaCargosComissao(): Promise<Map<number, string>> {
  try {
    const res = await sapl.cargosComissao('?page=1')
    return new Map((res.results ?? []).map((c) => [c.id, c.nome]))
  } catch {
    return new Map()
  }
}

/** Membros (titulares) de uma comissão, via composição → participação. */
export async function listarMembros(comissaoId: number): Promise<MembroComissao[]> {
  try {
    const comp = await sapl.composicoes(`?comissao=${comissaoId}`)
    const composicaoIds = (comp.results ?? []).map((c) => c.id)
    if (composicaoIds.length === 0) return []

    const cargos = await mapaCargosComissao()
    const listas = await Promise.all(
      composicaoIds.map((cid) => sapl.participacoes(`?composicao=${cid}`).then((r) => r.results ?? [])),
    )
    const parts = listas.flat()

    const membros = await Promise.all(
      parts.map(async (p) => {
        const parl = await saplFetch<Parlamentar>(`/api/parlamentares/parlamentar/${p.parlamentar}/`).catch(() => null)
        return {
          parlamentarId: p.parlamentar,
          nome: parl?.nome_parlamentar ?? `Parlamentar ${p.parlamentar}`,
          cargo: cargos.get(p.cargo) ?? 'Membro',
          fotoUrl: urlDocumento(parl?.fotografia),
        }
      }),
    )
    return membros
  } catch {
    return []
  }
}

/** Comissões de que um vereador participa (para o perfil). */
export async function comissoesDoVereador(parlamentarId: number): Promise<ComissaoDoVereador[]> {
  try {
    const [parts, cargos] = await Promise.all([
      sapl.participacoes(`?parlamentar=${parlamentarId}`),
      mapaCargosComissao(),
    ])
    const itens = parts.results ?? []
    if (itens.length === 0) return []

    const resultado = await Promise.all(
      itens.map(async (p) => {
        const comp = await saplFetch<{ comissao: number }>(`/api/comissoes/composicao/${p.composicao}/`).catch(() => null)
        if (!comp) return null
        const com = await saplFetch<Comissao>(`/api/comissoes/comissao/${comp.comissao}/`).catch(() => null)
        if (!com) return null
        return { id: com.id, nome: com.nome, sigla: com.sigla, cargo: cargos.get(p.cargo) ?? 'Membro' }
      }),
    )
    return resultado.filter((x): x is ComissaoDoVereador => x !== null)
  } catch {
    return []
  }
}
