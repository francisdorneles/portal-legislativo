/**
 * Vínculo local de votação → bairro (UnidadeTerritorial), escopo CÂMARA.
 *
 * Fonte de verdade: tabela CURADA de locais (locais-votacao*.json) — 22 locais de Taquari
 * com lat/lng + bairro + confiança. Curada à mão porque geocodificação grátis (Nominatim)
 * acerta só ~50% dos endereços rurais e devolve bairro inconsistente; com 22 pontos, uma
 * tabela versionada é mais precisa e barata que um pipeline frágil.
 *
 * vincularLocaisABairros:
 *   - cria/reaproveita uma UnidadeTerritorial por bairro distinto (geojson = Point centroide
 *     dos locais do bairro — representação INTERINA até entrar a malha IBGE de polígonos);
 *   - seta ResultadoEleitoral.unidadeId casando por localVotacao (nome do local).
 * Locais sem bairro na tabela ficam com unidadeId null → caem em "(sem bairro)" nas queries
 * (fallback por zona/seção continua sempre disponível em radar.queries).
 *
 * Roda DENTRO de contexto de tenant (a extensão injeta camaraId em leitura/escrita).
 */
import { readFileSync } from 'node:fs'
import { prisma } from '../../lib/prisma.js'
import { normalizarBairro } from './radar.queries.js'

export type LocalCurado = {
  endereco: string | null
  lat: number | null
  lng: number | null
  bairro: string | null
  confianca: 'alta' | 'media' | 'baixa'
}
/** chave = NM_LOCAL_VOTACAO exatamente como vem no TSE (case/acentos) */
export type TabelaLocais = Record<string, LocalCurado>

export function lerTabelaLocais(caminho: string): TabelaLocais {
  return JSON.parse(readFileSync(caminho, { encoding: 'utf8' })) as TabelaLocais
}

export type ResumoVinculo = {
  bairros: number
  locaisComBairro: number
  locaisSemBairro: number
  resultadosVinculados: number
  comPoligono: number
}

/** Geometria GeoJSON (Polygon/MultiPolygon) por nome de bairro normalizado. */
export type PoligonosPorBairro = Map<string, unknown>

/**
 * Carrega o GeoJSON oficial de bairros (IBGE CD2022) e indexa por nome normalizado.
 * Cada feature deve ter properties.nome + geometry (Polygon/MultiPolygon).
 */
export function lerPoligonosBairros(caminho: string): PoligonosPorBairro {
  const fc = JSON.parse(readFileSync(caminho, { encoding: 'utf8' })) as {
    features: { properties: { nome?: string }; geometry: unknown }[]
  }
  const m: PoligonosPorBairro = new Map()
  for (const f of fc.features) {
    if (f.properties?.nome) m.set(normalizarBairro(f.properties.nome), f.geometry)
  }
  return m
}

export async function vincularLocaisABairros(
  tabela: TabelaLocais,
  poligonos?: PoligonosPorBairro,
): Promise<ResumoVinculo> {
  // 1) agrupa locais por bairro (ignora os sem bairro)
  const porBairro = new Map<string, { nomesLocais: string[]; pontos: [number, number][] }>()
  let locaisSemBairro = 0
  for (const [nomeLocal, l] of Object.entries(tabela)) {
    if (!l.bairro) {
      locaisSemBairro++
      continue
    }
    const g = porBairro.get(l.bairro) ?? { nomesLocais: [], pontos: [] }
    g.nomesLocais.push(nomeLocal)
    if (l.lat != null && l.lng != null) g.pontos.push([l.lng, l.lat])
    porBairro.set(l.bairro, g)
  }

  // 2) cria/reaproveita UnidadeTerritorial por bairro + 3) vincula resultados
  let resultadosVinculados = 0
  let locaisComBairro = 0
  let comPoligono = 0
  for (const [bairro, g] of porBairro) {
    locaisComBairro += g.nomesLocais.length
    // preferir o polígono oficial (IBGE) ao Point centroide, quando o bairro casa
    const poligono = poligonos?.get(normalizarBairro(bairro)) ?? null
    if (poligono) comPoligono++
    const geometria = poligono ?? centroidPoint(g.pontos)
    let unidade = await prisma.unidadeTerritorial.findFirst({ where: { nome: bairro } })
    if (!unidade) {
      unidade = await prisma.unidadeTerritorial.create({
        data: { nome: bairro, geojson: geometria } as any,
      })
    } else {
      await prisma.unidadeTerritorial.update({
        where: { id: unidade.id },
        data: { geojson: (geometria ?? undefined) as any },
      })
    }
    for (const nomeLocal of g.nomesLocais) {
      const r = await prisma.resultadoEleitoral.updateMany({
        where: { localVotacao: nomeLocal },
        data: { unidadeId: unidade.id },
      })
      resultadosVinculados += r.count
    }
  }

  return {
    bairros: porBairro.size,
    locaisComBairro,
    locaisSemBairro,
    resultadosVinculados,
    comPoligono,
  }
}

/** Centroide simples (média) dos pontos [lng,lat] → GeoJSON Point, ou null se sem pontos. */
function centroidPoint(pontos: [number, number][]): { type: 'Point'; coordinates: [number, number] } | null {
  if (pontos.length === 0) return null
  const [sx, sy] = pontos.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0])
  return { type: 'Point', coordinates: [sx / pontos.length, sy / pontos.length] }
}
