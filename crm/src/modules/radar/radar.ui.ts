/**
 * Camada de queries do Radar para as PÁGINAS (server components).
 *
 * Segue o padrão do CRM: lê a sessão e envolve a query pura em withTenant — assim a
 * Prisma Extension isola por câmara (dados eleitorais) e por gabinete (demandas) ao mesmo
 * tempo, dentro do mesmo contexto. As funções puras vivem em radar.queries.ts (reusadas
 * por scripts/PoCs com contexto ambiente).
 */
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import type { TenantContext } from '@/lib/tenant-context'
import {
  cruzamentoBairroVotoDemanda,
  agregarVotosPorSecao,
  rankingCandidatos,
  mapaDisputa,
  type BairroCruzamento,
  type AgregadoCandidato,
  type DisputaBairro,
} from './radar.queries'

async function tenant(): Promise<TenantContext> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return session.tenant
}

/**
 * Nomes de bairros conhecidos da câmara (UnidadeTerritorial), em ordem alfabética.
 * Alimenta o datalist do form de demanda → padroniza o bairro digitado para casar com
 * o Radar (voto×demanda), sem impedir bairro novo.
 */
export async function listarBairrosConhecidos(): Promise<string[]> {
  return withTenant(await tenant(), async () => {
    const us = await prisma.unidadeTerritorial.findMany({
      select: { nome: true },
      orderBy: { nome: 'asc' },
    })
    return us.map((u) => u.nome)
  })
}

export type RadarPagina = {
  bairros: BairroCruzamento[]
  totalVotos: number
  totalDemandas: number
  secoes: number
  /** Bairros com muito voto e pouca demanda: base eleitoral sem atuação registrada. */
  oportunidades: BairroCruzamento[]
}

/**
 * Bairros-oportunidade: voto acima da mediana E demanda abaixo da média (inclui zero).
 * É o cruzamento que vira ação — onde há base eleitoral mas pouca presença do gabinete.
 */
function calcularOportunidades(bairros: BairroCruzamento[]): BairroCruzamento[] {
  if (bairros.length === 0) return []
  const votos = bairros.map((b) => b.votos).sort((a, b) => a - b)
  const medianaVotos = votos[Math.floor(votos.length / 2)]
  const mediaDemandas = bairros.reduce((s, b) => s + b.demandas, 0) / bairros.length
  return bairros
    .filter((b) => b.votos >= medianaVotos && b.demandas <= mediaDemandas)
    .sort((a, b) => b.votos - a.votos)
    .slice(0, 5)
}

export type MapaDisputaPagina = {
  candidatoTse: string | null
  bairros: DisputaBairro[]
  resumo: { meu: number; disputa: number; rival: number }
}

/** Mapa de Disputa do gabinete da sessão (lê o candidatoTse vinculado ao gabinete). */
export async function mapaDisputaParaPagina(): Promise<MapaDisputaPagina> {
  const t = await tenant()
  return withTenant(t, async () => {
    const gab = await prisma.gabinete.findUnique({
      where: { id: t.gabineteId },
      select: { candidatoTse: true },
    })
    const candidatoTse = gab?.candidatoTse ?? null
    if (!candidatoTse) return { candidatoTse: null, bairros: [], resumo: { meu: 0, disputa: 0, rival: 0 } }
    const bairros = await mapaDisputa(candidatoTse, { cargo: 'Vereador' })
    const resumo = bairros.reduce(
      (acc, b) => ({ ...acc, [b.classificacao]: acc[b.classificacao] + 1 }),
      { meu: 0, disputa: 0, rival: 0 } as { meu: number; disputa: number; rival: number },
    )
    return { candidatoTse, bairros, resumo }
  })
}

export type BairroDetalhe = {
  unidadeId: string
  bairro: string
  votos: number
  candidatos: AgregadoCandidato[]
} | null

/** Detalhe de um bairro: nome + ranking de candidatos ali (drill-down do Radar). */
export async function bairroDetalhe(unidadeId: string): Promise<BairroDetalhe> {
  return withTenant(await tenant(), async () => {
    const unidade = await prisma.unidadeTerritorial.findFirst({
      where: { id: unidadeId },
      select: { id: true, nome: true },
    })
    if (!unidade) return null // não existe ou é de outra câmara (isolado)
    const candidatos = await rankingCandidatos({ unidadeId, cargo: 'Vereador', limite: 20 })
    return {
      unidadeId: unidade.id,
      bairro: unidade.nome,
      votos: candidatos.reduce((s, c) => s + c.votos, 0),
      candidatos,
    }
  })
}

/** Cruzamento voto×demanda por bairro + totais + oportunidades, para a página do Radar. */
export async function radarParaPagina(): Promise<RadarPagina> {
  return withTenant(await tenant(), async () => {
    const [bairros, secoes] = await Promise.all([
      cruzamentoBairroVotoDemanda({ cargo: 'Vereador' }),
      agregarVotosPorSecao({ cargo: 'Vereador' }),
    ])
    return {
      bairros,
      totalVotos: bairros.reduce((s, b) => s + b.votos, 0),
      totalDemandas: bairros.reduce((s, b) => s + b.demandas, 0),
      secoes: secoes.length,
      oportunidades: calcularOportunidades(bairros),
    }
  })
}
