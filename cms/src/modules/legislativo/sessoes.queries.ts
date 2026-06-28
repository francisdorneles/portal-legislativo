import {
  sapl,
  saplFetch,
  type SessaoPlenaria,
  type OrdemDia,
  type MateriaLegislativa,
  type Parlamentar,
} from './sapl.client'
import { urlDocumento } from '@/lib/documentos'

/** Sessão com o nome do tipo já resolvido (o SAPL guarda só o id em `tipo`). */
export interface SessaoComTipo extends SessaoPlenaria {
  tipoNome: string
}

export interface SessoesResultado {
  itens: SessaoComTipo[]
  total: number
}

/** Mapa id→nome dos tipos de sessão (Ordinária, Extraordinária, Solene…). */
async function mapaTipos(): Promise<Map<number, string>> {
  try {
    const res = await sapl.tiposSessao('?page=1')
    return new Map((res.results ?? []).map((t) => [t.id, t.nome]))
  } catch {
    return new Map()
  }
}

function resolverTipo(s: SessaoPlenaria, tipos: Map<number, string>): SessaoComTipo {
  return { ...s, tipoNome: tipos.get(s.tipo) ?? 'Sessão Plenária' }
}

/** Tipos de sessão (Ordinária, Extraordinária, Solene…) para o filtro. Fonte: SAPL. */
export async function listarTiposSessao(): Promise<{ id: number; nome: string }[]> {
  try {
    const res = await sapl.tiposSessao('?page=1')
    return (res.results ?? []).map((t) => ({ id: t.id, nome: t.nome }))
  } catch {
    return []
  }
}

/** Lista sessões plenárias do SAPL, mais recentes primeiro. Filtra por tipo/data se informado. */
export async function listarSessoes(
  opts: { page?: number; tipo?: string; de?: string; ate?: string; q?: string } = {},
): Promise<SessoesResultado> {
  try {
    const page = opts.page ?? 1
    const p = new URLSearchParams({ page: String(page) })
    if (opts.tipo) p.set('tipo', opts.tipo)
    if (opts.de) p.set('data_inicio__gte', opts.de)
    if (opts.ate) p.set('data_inicio__lte', opts.ate)
    // Sessão não tem campo textual; a busca livre filtra pelo número da sessão.
    const numero = opts.q?.trim().match(/\d+/)?.[0]
    if (numero) p.set('numero', numero)
    const [res, tipos] = await Promise.all([
      sapl.sessoes(`?${p.toString()}`),
      mapaTipos(),
    ])
    const itens = (res.results ?? [])
      .map((s) => resolverTipo(s, tipos))
      .sort((a, b) => (b.data_inicio ?? '').localeCompare(a.data_inicio ?? ''))
    return { itens, total: res.pagination?.total_entries ?? itens.length }
  } catch {
    return { itens: [], total: 0 }
  }
}

/** Próxima sessão agendada: a futura mais próxima de `hoje`, ou null se não houver. */
export async function obterProximaSessao(hoje = new Date()): Promise<SessaoComTipo | null> {
  const { itens } = await listarSessoes()
  const hojeIso = hoje.toISOString().slice(0, 10)
  const futuras = itens
    .filter((s) => (s.data_inicio ?? '') >= hojeIso)
    .sort((a, b) => (a.data_inicio ?? '').localeCompare(b.data_inicio ?? ''))
  return futuras[0] ?? null
}

/**
 * Lista as próximas sessões (futuras, mais próximas primeiro). Se não houver
 * futuras suficientes, completa com as mais recentes já realizadas — assim a
 * home nunca fica vazia. Reusa `listarSessoes` (fonte: SAPL).
 */
export async function listarProximasSessoes(limite = 4, hoje = new Date()): Promise<SessaoComTipo[]> {
  const { itens } = await listarSessoes()
  const hojeIso = hoje.toISOString().slice(0, 10)
  const futuras = itens
    .filter((s) => (s.data_inicio ?? '') >= hojeIso)
    .sort((a, b) => (a.data_inicio ?? '').localeCompare(b.data_inicio ?? ''))
  if (futuras.length >= limite) return futuras.slice(0, limite)
  const passadas = itens.filter((s) => (s.data_inicio ?? '') < hojeIso) // listarSessoes já vem desc
  return [...futuras, ...passadas].slice(0, limite)
}

/** Uma sessão plenária pelo id (com tipo resolvido), ou null. */
export async function obterSessao(id: number): Promise<SessaoComTipo | null> {
  try {
    const [s, tipos] = await Promise.all([
      saplFetch<SessaoPlenaria>(`/api/sessao/sessaoplenaria/${id}/`),
      mapaTipos(),
    ])
    return resolverTipo(s, tipos)
  } catch {
    return null
  }
}

/** Item da pauta (Ordem do Dia) já enriquecido com a ementa da matéria. */
export interface ItemPauta extends OrdemDia {
  materiaTitulo: string
  materiaEmenta: string
}

/** Pauta (Ordem do Dia) de uma sessão, ordenada pela posição na pauta. */
export async function obterPauta(sessaoId: number): Promise<ItemPauta[]> {
  try {
    const res = await sapl.ordemDia(`?sessao_plenaria=${sessaoId}`)
    const itens = res.results ?? []

    const materias = await Promise.all(
      itens.map((o) =>
        saplFetch<MateriaLegislativa>(`/api/materia/materialegislativa/${o.materia}/`).catch(() => null),
      ),
    )

    return itens
      .map((o, i) => ({
        ...o,
        materiaTitulo: materias[i]?.__str__ ?? `Matéria ${o.materia}`,
        materiaEmenta: materias[i]?.ementa ?? '',
      }))
      .sort((a, b) => (a.numero_ordem ?? 0) - (b.numero_ordem ?? 0))
  } catch {
    return []
  }
}

/** Um orador na tribuna, já com o nome do parlamentar resolvido. */
export interface Orador {
  id: number
  ordem: number
  parlamentarId: number
  nome: string
  fotoUrl: string | null
  tema?: string
  urlDiscurso?: string
}

/** Oradores de uma sessão, separados por fase (Expediente × Ordem do Dia). */
export interface OradoresSessao {
  expediente: Orador[]
  ordemDia: Orador[]
}

/** Mapa id→{nome,fotoUrl} dos parlamentares (para resolver oradores/presença). */
async function mapaParlamentares(): Promise<Map<number, { nome: string; fotoUrl: string | null }>> {
  try {
    const res = await sapl.parlamentares('?page=1')
    return new Map(
      (res.results ?? []).map((p: Parlamentar) => [
        p.id,
        { nome: p.nome_parlamentar ?? `Parlamentar ${p.id}`, fotoUrl: urlDocumento(p.fotografia) },
      ]),
    )
  } catch {
    return new Map()
  }
}

/**
 * Oradores de uma sessão plenária (quem usou a tribuna no Expediente e na
 * Ordem do Dia), ordenados pela ordem de pronunciamento. Fonte: SAPL.
 */
export async function oradoresDaSessao(sessaoId: number): Promise<OradoresSessao> {
  try {
    const [expRes, odRes, nomes] = await Promise.all([
      sapl.oradoresExpediente(`?sessao_plenaria=${sessaoId}`),
      sapl.oradoresOrdemDia(`?sessao_plenaria=${sessaoId}`),
      mapaParlamentares(),
    ])
    const montar = (r: { parlamentar: number; id: number; numero_ordem: number; observacao?: string; url_discurso?: string }): Orador => {
      const p = nomes.get(r.parlamentar)
      return {
        id: r.id,
        ordem: r.numero_ordem,
        parlamentarId: r.parlamentar,
        nome: p?.nome ?? `Parlamentar ${r.parlamentar}`,
        fotoUrl: p?.fotoUrl ?? null,
        tema: r.observacao || undefined,
        urlDiscurso: r.url_discurso || undefined,
      }
    }
    const ordenar = (a: Orador, b: Orador) => a.ordem - b.ordem
    return {
      expediente: (expRes.results ?? []).map(montar).sort(ordenar),
      ordemDia: (odRes.results ?? []).map(montar).sort(ordenar),
    }
  } catch {
    return { expediente: [], ordemDia: [] }
  }
}
