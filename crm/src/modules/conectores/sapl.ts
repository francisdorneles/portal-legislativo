/**
 * Conector — SAPL (Sistema de Apoio ao Processo Legislativo / Interlegis).
 *
 * Cada câmara que usa SAPL expõe uma API REST pública (Django REST) na própria instância:
 *   {saplUrl}/api/materia/materialegislativa/   → proposições/matérias (Indicação, Requerimento…)
 *   {saplUrl}/api/parlamentares/parlamentar/    → vereadores
 * A `saplUrl` mora em `Camara.saplUrl` (cadastro), então o conector NÃO hard-codeia nada:
 * quem chama passa a URL da câmara da sessão. Dado é PÚBLICO (escopo câmara, não gabinete) —
 * quem cruza com o gabinete (ex.: demanda → virou proposição?) é a camada de inteligência.
 *
 * Resiliente como o conector do Querido Diário: timeout curto e degrada com `ok:false`
 * (muitas câmaras pequenas — ex.: Taquari — NÃO usam SAPL; nesse caso `saplUrl` é null).
 */

export type MateriaSapl = {
  id: number
  titulo: string // legível: "INDICAÇÃO nº 1 de 2026" (campo __str__ do SAPL)
  numero: number
  ano: number
  tipo: number // id do tipo (resolver via tipomaterialegislativa se precisar do nome)
  ementa: string
  dataApresentacao: string // YYYY-MM-DD
  emTramitacao: boolean
  autores: number[] // ids de parlamentar (resolver via listarParlamentares)
  textoUrl: string | null // PDF do texto original
}

export type ParlamentarSapl = {
  id: number
  nome: string
}

export type Resultado<T> = { ok: true; total: number; itens: T[] } | { ok: false; erro: string }

/** Normaliza a base: garante esquema, sem barra final, e devolve `{base}/api`. */
function apiBase(saplUrl: string): string {
  const u = saplUrl.trim().replace(/\/+$/, '')
  const comEsquema = /^https?:\/\//i.test(u) ? u : `https://${u}`
  return `${comEsquema}/api`
}

async function getJson(url: string, timeoutMs = 12000): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, { headers: { accept: 'application/json' }, signal: ctrl.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } finally {
    clearTimeout(timer)
  }
}

/** Lê `pagination.total_entries` (DRF do SAPL) com fallbacks defensivos. */
function lerTotal(j: Record<string, unknown>, fallback: number): number {
  const p = j.pagination as Record<string, unknown> | undefined
  const t = p?.total_entries ?? j.count
  return typeof t === 'number' ? t : fallback
}

function mapMateria(m: Record<string, unknown>): MateriaSapl {
  return {
    id: Number(m.id ?? 0),
    titulo: String(m.__str__ ?? '').trim(),
    numero: Number(m.numero ?? 0),
    ano: Number(m.ano ?? 0),
    tipo: Number(m.tipo ?? 0),
    ementa: String(m.ementa ?? '').trim(),
    dataApresentacao: String(m.data_apresentacao ?? ''),
    emTramitacao: Boolean(m.em_tramitacao),
    autores: Array.isArray(m.autores) ? (m.autores as unknown[]).map(Number) : [],
    textoUrl: (m.texto_original as string) || null,
  }
}

/**
 * Busca matérias legislativas de uma câmara (a `saplUrl` vem do cadastro da câmara da sessão).
 * Filtra por ano e/ou parlamentar autor; ordena por mais recente.
 */
export async function buscarMaterias(opts: {
  saplUrl: string
  ano?: number
  autor?: number // id de parlamentar
  size?: number
}): Promise<Resultado<MateriaSapl>> {
  const p = new URLSearchParams()
  p.set('format', 'json')
  p.set('ordering', '-ano,-numero')
  p.set('get_all', 'false')
  if (opts.ano) p.set('ano', String(opts.ano))
  if (opts.autor) p.set('autores', String(opts.autor))
  // DRF do SAPL pagina por page/page_size; pedimos a 1ª página com tamanho controlado.
  p.set('page_size', String(opts.size ?? 20))

  try {
    const j = (await getJson(`${apiBase(opts.saplUrl)}/materia/materialegislativa/?${p}`)) as Record<string, unknown>
    const arr = Array.isArray(j.results) ? (j.results as Record<string, unknown>[]) : []
    const itens = arr.map(mapMateria)
    return { ok: true, total: lerTotal(j, itens.length), itens }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'falha de rede (SAPL indisponível)' }
  }
}

/** Lista os parlamentares da câmara — útil pra resolver autores e casar com o vereador do gabinete. */
export async function listarParlamentares(saplUrl: string): Promise<Resultado<ParlamentarSapl>> {
  const p = new URLSearchParams({ format: 'json', page_size: '100' })
  try {
    const j = (await getJson(`${apiBase(saplUrl)}/parlamentares/parlamentar/?${p}`)) as Record<string, unknown>
    const arr = Array.isArray(j.results) ? (j.results as Record<string, unknown>[]) : []
    const itens: ParlamentarSapl[] = arr.map((x) => ({
      id: Number(x.id ?? 0),
      nome: String(x.nome_parlamentar ?? x.__str__ ?? '').trim(),
    }))
    return { ok: true, total: lerTotal(j, itens.length), itens }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'falha de rede (SAPL indisponível)' }
  }
}
