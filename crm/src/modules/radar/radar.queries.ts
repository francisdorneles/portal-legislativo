/**
 * Queries de agregação do Radar do Mandato (escopo CÂMARA).
 *
 * O dado bruto do TSE é por SEÇÃO (zona/seção/local de votação) — granularidade nativa,
 * 100% confiável. A agregação por BAIRRO é uma camada derivada: depende de vincular cada
 * local de votação a uma UnidadeTerritorial (ver agregacao.ts). Enquanto um local não tem
 * bairro vinculado, ele cai no balde "(sem bairro)" — o Radar funciona mesmo incompleto.
 *
 * Todas as leituras passam pela Prisma Extension (groupBy é LEITURA → injeta camaraId),
 * então o isolamento por câmara é automático. Devem rodar dentro de contexto de tenant.
 */
import { prisma } from '../../lib/prisma.js'

export type AgregadoSecao = {
  zona: number | null
  secao: number | null
  localVotacao: string | null
  votos: number
}

export type AgregadoBairro = {
  unidadeId: string | null
  bairro: string // nome da UnidadeTerritorial, ou "(sem bairro)" para não vinculados
  votos: number
}

export type AgregadoCandidato = {
  candidatoNome: string
  votos: number
}

/** Votos somados por seção (sempre disponível — não depende de geocodificação). */
export async function agregarVotosPorSecao(
  filtro: { ano?: number; cargo?: string } = {},
): Promise<AgregadoSecao[]> {
  const rows = await prisma.resultadoEleitoral.groupBy({
    by: ['zona', 'secao', 'localVotacao'],
    where: filtro,
    _sum: { votos: true },
  })
  return rows
    .map((r) => ({
      zona: r.zona,
      secao: r.secao,
      localVotacao: r.localVotacao,
      votos: r._sum.votos ?? 0,
    }))
    .sort((a, b) => b.votos - a.votos)
}

/** Votos somados por bairro (UnidadeTerritorial). Não vinculados → "(sem bairro)". */
export async function agregarVotosPorBairro(
  filtro: { ano?: number; cargo?: string } = {},
): Promise<AgregadoBairro[]> {
  const [rows, unidades] = await Promise.all([
    prisma.resultadoEleitoral.groupBy({
      by: ['unidadeId'],
      where: filtro,
      _sum: { votos: true },
    }),
    prisma.unidadeTerritorial.findMany({ select: { id: true, nome: true } }),
  ])
  const nomePorId = new Map(unidades.map((u) => [u.id, u.nome]))
  return rows
    .map((r) => ({
      unidadeId: r.unidadeId,
      bairro: r.unidadeId ? (nomePorId.get(r.unidadeId) ?? '(bairro removido)') : '(sem bairro)',
      votos: r._sum.votos ?? 0,
    }))
    .sort((a, b) => b.votos - a.votos)
}

export type BairroCruzamento = {
  unidadeId: string
  bairro: string
  lat: number | null
  lng: number | null
  /** geometria do bairro: Polygon/MultiPolygon (IBGE) ou Point (centroide interino) */
  geojson: unknown | null
  votos: number
  demandas: number
}

/** Normaliza nome de bairro para casar voto×demanda: minúsculo, sem acento, sem "(...)" . */
export function normalizarBairro(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * CRUZAMENTO ESTRATÉGICO — por bairro: votos (câmara) × nº de demandas (gabinete).
 *
 * Combina dois escopos: ResultadoEleitoral/UnidadeTerritorial (camara) e Demanda (gabinete).
 * Dentro do contexto de tenant, a extensão isola cada um pelo seu escopo automaticamente.
 * Demandas casam com o bairro pela versão normalizada do nome (texto livre vs. curado).
 */
export async function cruzamentoBairroVotoDemanda(
  filtro: { ano?: number; cargo?: string } = {},
): Promise<BairroCruzamento[]> {
  const [unidades, votosRows, demandas] = await Promise.all([
    prisma.unidadeTerritorial.findMany({ select: { id: true, nome: true, geojson: true } }),
    prisma.resultadoEleitoral.groupBy({ by: ['unidadeId'], where: filtro, _sum: { votos: true } }),
    prisma.demanda.findMany({ where: { bairro: { not: null } }, select: { bairro: true } }),
  ])

  const votosPorUnidade = new Map<string, number>()
  for (const r of votosRows) if (r.unidadeId) votosPorUnidade.set(r.unidadeId, r._sum.votos ?? 0)

  const demandasPorBairroNorm = new Map<string, number>()
  for (const d of demandas) {
    if (!d.bairro) continue
    const k = normalizarBairro(d.bairro)
    demandasPorBairroNorm.set(k, (demandasPorBairroNorm.get(k) ?? 0) + 1)
  }

  return unidades
    .map((u) => {
      const ponto = centroideDeGeojson(u.geojson)
      return {
        unidadeId: u.id,
        bairro: u.nome,
        lat: ponto?.[1] ?? null,
        lng: ponto?.[0] ?? null,
        geojson: u.geojson ?? null,
        votos: votosPorUnidade.get(u.id) ?? 0,
        demandas: demandasPorBairroNorm.get(normalizarBairro(u.nome)) ?? 0,
      }
    })
    .sort((a, b) => b.votos - a.votos)
}

/** Ponto representativo [lng,lat] de um GeoJSON Point/Polygon/MultiPolygon (média do anel externo). */
function centroideDeGeojson(g: unknown): [number, number] | null {
  if (!g || typeof g !== 'object') return null
  const tipo = (g as any).type
  const c = (g as any).coordinates
  if (tipo === 'Point' && Array.isArray(c) && c.length === 2) return [Number(c[0]), Number(c[1])]
  // anel externo: Polygon = coords[0]; MultiPolygon = coords[0][0]
  const anel = tipo === 'Polygon' ? c?.[0] : tipo === 'MultiPolygon' ? c?.[0]?.[0] : null
  if (Array.isArray(anel) && anel.length) {
    const [sx, sy] = anel.reduce(([ax, ay]: number[], p: number[]) => [ax + p[0], ay + p[1]], [0, 0])
    return [sx / anel.length, sy / anel.length]
  }
  return null
}

export type ClassificacaoDisputa = 'meu' | 'disputa' | 'rival'

export type DisputaBairro = {
  unidadeId: string
  bairro: string
  lat: number | null
  lng: number | null
  geojson: unknown | null
  meusVotos: number
  liderNome: string // candidato mais votado no bairro (pode ser eu)
  liderVotos: number
  totalVotos: number
  classificacao: ClassificacaoDisputa
}

/**
 * MAPA DE DISPUTA — por bairro, meu candidato × o líder local.
 *   meu      = eu sou o mais votado no bairro
 *   disputa  = não lidero, mas estou no jogo (≥50% dos votos do líder)
 *   rival    = líder me supera com folga (<50%)
 * Inteligência competitiva: onde defender, onde brigar, onde estou fora.
 */
export async function mapaDisputa(
  candidatoTse: string,
  filtro: { ano?: number; cargo?: string } = {},
): Promise<DisputaBairro[]> {
  const [unidades, rows] = await Promise.all([
    prisma.unidadeTerritorial.findMany({ select: { id: true, nome: true, geojson: true } }),
    prisma.resultadoEleitoral.groupBy({
      by: ['unidadeId', 'candidatoNome'],
      where: filtro,
      _sum: { votos: true },
    }),
  ])

  // por unidade: meus votos, líder e total
  type Acc = { meus: number; liderNome: string; liderVotos: number; total: number }
  const porUnidade = new Map<string, Acc>()
  for (const r of rows) {
    if (!r.unidadeId) continue
    const v = r._sum.votos ?? 0
    const a = porUnidade.get(r.unidadeId) ?? { meus: 0, liderNome: '', liderVotos: 0, total: 0 }
    a.total += v
    if (r.candidatoNome === candidatoTse) a.meus = v
    if (v > a.liderVotos) {
      a.liderVotos = v
      a.liderNome = r.candidatoNome
    }
    porUnidade.set(r.unidadeId, a)
  }

  return unidades
    .map((u) => {
      const a = porUnidade.get(u.id) ?? { meus: 0, liderNome: '—', liderVotos: 0, total: 0 }
      const classificacao: ClassificacaoDisputa =
        a.meus >= a.liderVotos && a.meus > 0
          ? 'meu'
          : a.liderVotos > 0 && a.meus >= 0.5 * a.liderVotos
            ? 'disputa'
            : 'rival'
      const ponto = centroideDeGeojson(u.geojson)
      return {
        unidadeId: u.id,
        bairro: u.nome,
        lat: ponto?.[1] ?? null,
        lng: ponto?.[0] ?? null,
        geojson: u.geojson ?? null,
        meusVotos: a.meus,
        liderNome: a.liderNome,
        liderVotos: a.liderVotos,
        totalVotos: a.total,
        classificacao,
      }
    })
    .sort((a, b) => b.totalVotos - a.totalVotos)
}

/** Ranking de candidatos dentro de um bairro (ou geral, se unidadeId omitido). */
export async function rankingCandidatos(
  opts: { unidadeId?: string | null; ano?: number; cargo?: string; limite?: number } = {},
): Promise<AgregadoCandidato[]> {
  const where: Record<string, unknown> = {}
  if (opts.ano != null) where.ano = opts.ano
  if (opts.cargo != null) where.cargo = opts.cargo
  if ('unidadeId' in opts) where.unidadeId = opts.unidadeId
  const rows = await prisma.resultadoEleitoral.groupBy({
    by: ['candidatoNome'],
    where,
    _sum: { votos: true },
  })
  return rows
    .map((r) => ({ candidatoNome: r.candidatoNome, votos: r._sum.votos ?? 0 }))
    .sort((a, b) => b.votos - a.votos)
    .slice(0, opts.limite ?? 10)
}
