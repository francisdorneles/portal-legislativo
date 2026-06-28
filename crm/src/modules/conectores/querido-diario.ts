/**
 * Conector — Querido Diário (Open Knowledge Brasil): diários oficiais municipais.
 *
 * API pública: https://api.queridodiario.ok.org.br (subdomínio `api.` — NÃO o /api do site,
 * que cai no Cloudflare). Configurável por env QD_API_URL (pode apontar p/ instância
 * self-hosted via Docker). Degrada com elegância (retorna ok:false) e tem timeout curto.
 *
 * ⚠️ Cobertura: o QD raspa só os municípios já mapeados — cidades pequenas (ex.: Taquari)
 * podem retornar 0. A vigilância trata "sem resultado" normalmente.
 *
 * Dado é PÚBLICO (não é por gabinete) — a vigilância (Vigia) é que cruza com o gabinete.
 */
const QD_URL = process.env.QD_API_URL ?? 'https://api.queridodiario.ok.org.br'

export type ItemDiario = {
  data: string // YYYY-MM-DD
  municipio: string
  url: string // PDF do diário
  txtUrl: string | null // texto extraído (quando disponível)
  edicao: string | null
  trechos: string[] // excerpts que casaram a busca
}

export type ResultadoDiario = { ok: true; total: number; itens: ItemDiario[] } | { ok: false; erro: string }

/**
 * Busca no diário oficial de um município (código IBGE 7 dígitos), opcionalmente filtrando
 * por termo e janela de datas.
 */
export async function buscarDiario(opts: {
  ibge: string
  query?: string
  desde?: string // YYYY-MM-DD
  ate?: string
  size?: number
}): Promise<ResultadoDiario> {
  const p = new URLSearchParams()
  p.set('territory_ids', opts.ibge)
  if (opts.query) p.set('querystring', opts.query)
  if (opts.desde) p.set('published_since', opts.desde)
  if (opts.ate) p.set('published_until', opts.ate)
  p.set('size', String(opts.size ?? 10))
  p.set('sort_by', 'descending_date')

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 12000)
    const r = await fetch(`${QD_URL}/gazettes?${p.toString()}`, {
      headers: { accept: 'application/json' },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!r.ok) return { ok: false, erro: `HTTP ${r.status} (API do diário indisponível/bloqueada)` }

    const j = (await r.json()) as {
      total_gazettes?: number
      gazettes?: Array<Record<string, unknown>>
    }
    const itens: ItemDiario[] = (j.gazettes ?? []).map((g) => ({
      data: String(g.date ?? ''),
      municipio: String(g.territory_name ?? ''),
      url: String(g.url ?? ''),
      txtUrl: (g.txt_url as string) ?? null,
      edicao: (g.edition_number as string) ?? (g.edition as string) ?? null,
      trechos: Array.isArray(g.excerpts) ? (g.excerpts as string[]) : [],
    }))
    return { ok: true, total: j.total_gazettes ?? itens.length, itens }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : 'falha de rede' }
  }
}
