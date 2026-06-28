import { sapl, saplFetch, type Parlamentar, type Mandato, type Legislatura } from './sapl.client'
import { urlDocumento } from '@/lib/documentos'

export interface EstatisticasVereador {
  projetos: number | null
  votacoes: number | null
  presencaPercent: number | null
}

export interface MandatoHistorico {
  id: number
  legislaturaLabel: string
  /** YYYY-MM-DD */
  inicio: string | null
  /** YYYY-MM-DD */
  fim: string | null
  votos: number | null
  titular: boolean
}

export interface Vereador extends Partial<Parlamentar> {
  id: number
  nome_parlamentar: string
  nome_completo?: string
  partidoSigla: string
  fotoUrl: string | null
  email?: string
  telefone?: string
  numero_gab_parlamentar?: string
  profissao?: string
  biografia?: string
  /** true quando é suplente convocado (titular afastado p/ cargo executivo etc.) */
  suplente?: boolean
  /** Todos os mandatos do parlamentar, do mais recente ao mais antigo */
  mandatosHistorico?: MandatoHistorico[]
  estatisticas?: EstatisticasVereador
}

async function mapaPartidos(): Promise<Map<number, string>> {
  const mapa = new Map<number, string>()
  try {
    const siglaPorId = new Map<number, string>()
    let page = 1
    for (;;) {
      const part = await sapl.partidos(`?page=${page}`)
      for (const p of part.results ?? []) siglaPorId.set(p.id, p.sigla)
      if (!part.pagination?.next_page) break
      page = part.pagination.next_page
    }
    const fil = await sapl.filiacoes('?page=1')
    for (const f of fil.results ?? []) {
      if (f.data_desfiliacao) continue
      const sigla = siglaPorId.get(f.partido)
      if (sigla) mapa.set(f.parlamentar, sigla)
    }
  } catch { /* sem partidos */ }
  return mapa
}

function enriquecer(p: Parlamentar, partidos: Map<number, string>, suplente = false): Vereador {
  return {
    ...p,
    nome_parlamentar: p.nome_parlamentar ?? '',
    partidoSigla: partidos.get(p.id) ?? '',
    fotoUrl: urlDocumento(p.fotografia),
    profissao: p.profissao,
    suplente,
  }
}

async function legislaturasMap(): Promise<Map<number, Legislatura>> {
  const mapa = new Map<number, Legislatura>()
  try {
    let page = 1
    for (;;) {
      const res = await sapl.legislaturas(`?page=${page}`)
      for (const l of res.results ?? []) mapa.set(l.id, l)
      if (!res.pagination?.next_page) break
      page = res.pagination.next_page
    }
  } catch { /* sem legislaturas */ }
  return mapa
}

async function mandatosDoMembro(parlamentarId: number, legs: Map<number, Legislatura>): Promise<MandatoHistorico[]> {
  const lista: MandatoHistorico[] = []
  try {
    let page = 1
    for (;;) {
      const res = await sapl.mandatos(`?parlamentar=${parlamentarId}&page=${page}`)
      for (const m of res.results ?? []) {
        const leg = legs.get(m.legislatura)
        const anoIni = leg?.data_inicio?.slice(0, 4) ?? '?'
        const anoFim = leg?.data_fim?.slice(0, 4) ?? '?'
        lista.push({
          id: m.id,
          legislaturaLabel: `${anoIni}–${anoFim}`,
          inicio: m.data_inicio_mandato ?? null,
          fim: m.data_fim_mandato ?? null,
          votos: m.votos_recebidos ?? null,
          titular: m.titular !== false,
        })
      }
      if (!res.pagination?.next_page) break
      page = res.pagination.next_page
    }
  } catch { /* sem mandatos */ }
  return lista.sort((a, b) => (b.inicio ?? '').localeCompare(a.inicio ?? ''))
}

/** Legislatura ativa (data_inicio <= hoje <= data_fim). */
async function legislaturaAtual(): Promise<number | null> {
  try {
    const res = await sapl.legislaturas('?page=1')
    const hoje = new Date().toISOString().slice(0, 10)
    const atual = (res.results ?? [] as Legislatura[]).find(
      (l) => l.data_inicio <= hoje && (!l.data_fim || l.data_fim >= hoje),
    )
    return atual?.id ?? null
  } catch {
    return null
  }
}

/**
 * Mandatos da legislatura vigente.
 * Retorna mapa: parlamentarId → Mandato
 */
async function mandatosDaLegislatura(legislaturaId: number): Promise<Map<number, Mandato>> {
  const mapa = new Map<number, Mandato>()
  try {
    let page = 1
    for (;;) {
      const res = await sapl.mandatos(`?legislatura=${legislaturaId}&page=${page}`)
      for (const m of res.results ?? []) mapa.set(m.parlamentar, m)
      if (!res.pagination?.next_page) break
      page = res.pagination.next_page
    }
  } catch { /* sem mandatos */ }
  return mapa
}

export async function listarVereadores(): Promise<Vereador[]> {
  try {
    const [res, partidos, legId] = await Promise.all([
      sapl.parlamentares('?page=1'),
      mapaPartidos(),
      legislaturaAtual(),
    ])

    const todos = (res.results ?? []).filter((p) => p.ativo !== false)

    // Sem legislatura identificada → fallback simples (sem filtro de mandato)
    if (!legId) {
      return todos
        .map((p) => enriquecer(p, partidos))
        .sort((a, b) => a.nome_parlamentar.localeCompare(b.nome_parlamentar))
    }

    const mandatos = await mandatosDaLegislatura(legId)

    return todos
      .map((p) => {
        const m = mandatos.get(p.id)
        // Sem mandato na legislatura atual → não exibir
        if (!m) return null
        // Titular afastado (assumiu cargo executivo, etc.) → não exibir na lista principal
        if (m.titular && m.tipo_afastamento != null) return null
        // Suplente convocado (titular=false) ou titular ativo
        return enriquecer(p, partidos, !m.titular)
      })
      .filter((v): v is Vereador => v !== null)
      .sort((a, b) => {
        // Titulares primeiro, depois suplentes convocados
        if (a.suplente !== b.suplente) return a.suplente ? 1 : -1
        return a.nome_parlamentar.localeCompare(b.nome_parlamentar)
      })
  } catch {
    return []
  }
}

/**
 * Suplentes cadastrados na legislatura vigente que ainda NÃO estão convocados
 * (titular=false, sem afastamento de titular correspondente).
 * Usados para exibir o banco de reservas na página de vereadores.
 */
export async function listarSuplentes(): Promise<Vereador[]> {
  try {
    const legId = await legislaturaAtual()
    if (!legId) return []

    const mandatos = await mandatosDaLegislatura(legId)
    const suplentesIds = [...mandatos.values()]
      .filter((m) => !m.titular)
      .map((m) => m.parlamentar)
    if (suplentesIds.length === 0) return []

    const partidos = await mapaPartidos()
    const parlamentares = await Promise.all(
      suplentesIds.map((id) =>
        saplFetch<Parlamentar>(`/api/parlamentares/parlamentar/${id}/`).catch(() => null),
      ),
    )
    return parlamentares
      .filter((p): p is Parlamentar => p !== null)
      .map((p) => enriquecer(p, partidos, true))
      .sort((a, b) => a.nome_parlamentar.localeCompare(b.nome_parlamentar))
  } catch {
    return []
  }
}

async function buscarEstatisticas(parlamentarId: number): Promise<EstatisticasVereador> {
  type Paginado = { pagination?: { total_entries?: number } }
  const [autorias, votos, presencas, sessoes] = await Promise.allSettled([
    saplFetch<Paginado>(`/api/materia/autoria/?autor__parlamentar=${parlamentarId}&page=1`),
    saplFetch<Paginado>(`/api/sessao/votoparlamentar/?parlamentar=${parlamentarId}&page=1`),
    saplFetch<Paginado>(`/api/sessao/presencaordemdia/?parlamentar=${parlamentarId}&page=1`),
    saplFetch<Paginado>(`/api/sessao/sessaoplenaria/?page=1`),
  ])

  const totalPresencas = presencas.status === 'fulfilled' ? (presencas.value.pagination?.total_entries ?? null) : null
  const totalSessoes = sessoes.status === 'fulfilled' ? (sessoes.value.pagination?.total_entries ?? null) : null
  const presencaPercent =
    totalPresencas != null && totalSessoes != null && totalSessoes > 0
      ? Math.round((totalPresencas / totalSessoes) * 100)
      : null

  return {
    projetos: autorias.status === 'fulfilled' ? (autorias.value.pagination?.total_entries ?? null) : null,
    votacoes: votos.status === 'fulfilled' ? (votos.value.pagination?.total_entries ?? null) : null,
    presencaPercent,
  }
}

export async function obterVereador(id: number): Promise<Vereador | null> {
  try {
    const [p, partidos, legs] = await Promise.all([
      saplFetch<Parlamentar>(`/api/parlamentares/parlamentar/${id}/`),
      mapaPartidos(),
      legislaturasMap(),
    ])
    const v = enriquecer(p, partidos)
    ;[v.mandatosHistorico, v.estatisticas] = await Promise.all([
      mandatosDoMembro(id, legs),
      buscarEstatisticas(id),
    ])
    return v
  } catch {
    return null
  }
}
