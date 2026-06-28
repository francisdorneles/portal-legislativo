/**
 * PoC Fase 2 (Radar) — Mapa de Disputa + isolamento multi-tenant por CÂMARA.
 *
 * mapaDisputa lê ResultadoEleitoral (escopo 'camara') e classifica cada bairro relativo ao
 * candidato do gabinete (Gabinete.candidatoTse). Prova que:
 *   1. mapaDisputa na Câmara A classifica os bairros (meu/disputa/rival somam o total)
 *   2. a classificação é RELATIVA ao candidato: trocar de candidato muda o resultado, mas
 *      os votos totais por bairro são os mesmos (mesmo dado da câmara)
 *   3. Câmara B (sem import) NÃO vê nada da A — mapaDisputa retorna vazio (isolamento)
 *   4. candidato inexistente → tudo 'rival' (meusVotos 0), sem quebrar
 *
 * Roda: pnpm poc:radar-disputa   (precisa do banco). ⚠️ Limpa o banco — rode pnpm db:seed depois.
 */
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma.js'
import { runComTenant } from '../src/lib/tenant-context.js'
import { lerCsvTse, importarResultadosTse } from '../src/modules/radar/tse-import.js'
import { lerTabelaLocais, lerPoligonosBairros, vincularLocaisABairros } from '../src/modules/radar/agregacao.js'
import { mapaDisputa } from '../src/modules/radar/radar.queries.js'

const CSV = resolve(process.cwd(), 'spike-crm/amostras/tse-secao-taquari-vereador-2024.csv')
const TABELA = resolve(process.cwd(), 'spike-crm/amostras/locais-votacao-taquari.json')
const POLIGONOS = resolve(process.cwd(), 'spike-crm/amostras/bairros-taquari.geojson')

const CAND_A = 'LUCIANO FABIANO MARIA DA SILVA'
const CAND_B = 'ADEMIR BICA FAGUNDES' // o líder geral — deve ter mais 'meu' que o CAND_A

function check(nome: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${nome}`)
  if (!ok) process.exitCode = 1
}

async function main() {
  // limpeza FK-safe (admin)
  await prisma.resultadoEleitoral.deleteMany({})
  await prisma.unidadeTerritorial.deleteMany({})
  await prisma.movimentacaoDemanda.deleteMany({})
  await prisma.demanda.deleteMany({})
  await prisma.comunicacaoEnviada.deleteMany({})
  await prisma.alerta.deleteMany({})
  await prisma.documentoGabinete.deleteMany({})
  await prisma.cidadao.deleteMany({})
  await prisma.usuario.deleteMany({})
  await prisma.gabinete.deleteMany({})
  await prisma.camara.deleteMany({})

  const camA = await prisma.camara.create({ data: { nome: 'Câmara A', municipio: 'Taquari', uf: 'RS' } })
  const camB = await prisma.camara.create({ data: { nome: 'Câmara B', municipio: 'Outra', uf: 'RS' } })
  const ctxA = { camaraId: camA.id, gabineteId: 'n/a' }
  const ctxB = { camaraId: camB.id, gabineteId: 'n/a' }

  const linhas = lerCsvTse(CSV)
  const tabela = lerTabelaLocais(TABELA)
  const poligonos = lerPoligonosBairros(POLIGONOS)

  // import + vínculo só na A
  await runComTenant(ctxA, async () => {
    await importarResultadosTse(linhas)
    await vincularLocaisABairros(tabela, poligonos)
  })

  // 1. disputa na A classifica todos os bairros
  const dispA = await runComTenant(ctxA, async () => await mapaDisputa(CAND_A, { cargo: 'Vereador' }))
  const resumoA = contar(dispA)
  const totalClassificado = resumoA.meu + resumoA.disputa + resumoA.rival
  check(`1. disputa na A (${CAND_A}): ${JSON.stringify(resumoA)} soma ${totalClassificado} = ${dispA.length} bairros`,
    dispA.length > 0 && totalClassificado === dispA.length)

  // 2. relativa ao candidato: CAND_B (líder geral) tem mais 'meu', mesmo total por bairro
  const dispB = await runComTenant(ctxA, async () => await mapaDisputa(CAND_B, { cargo: 'Vereador' }))
  const resumoB = contar(dispB)
  const mesmosTotais = bairrosIguaisNoTotal(dispA, dispB)
  check(`2. trocar candidato muda classificação (B '${CAND_B}' meu=${resumoB.meu} > A meu=${resumoA.meu}) e mantém totais por bairro`,
    resumoB.meu > resumoA.meu && mesmosTotais)

  // 3. Câmara B não vê nada da A
  const dispOutraCamara = await runComTenant(ctxB, async () => await mapaDisputa(CAND_A, { cargo: 'Vereador' }))
  check('3. mapaDisputa na Câmara B vê 0 bairros (isolado)', dispOutraCamara.length === 0)

  // 4. candidato inexistente → tudo rival, sem quebrar
  const dispFantasma = await runComTenant(ctxA, async () => await mapaDisputa('CANDIDATO QUE NÃO EXISTE', { cargo: 'Vereador' }))
  const semMeus = dispFantasma.every((b) => b.meusVotos === 0)
  const resumoF = contar(dispFantasma)
  check(`4. candidato inexistente → meus=0 em todos, ${resumoF.rival} rival`, semMeus && resumoF.meu === 0)

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  PoC FALHOU.' : '\n🎉 Mapa de Disputa isolado por câmara e relativo ao candidato confirmado.')
}

function contar(bairros: { classificacao: string }[]) {
  const r = { meu: 0, disputa: 0, rival: 0 }
  for (const b of bairros) (r as any)[b.classificacao]++
  return r
}

function bairrosIguaisNoTotal(
  a: { unidadeId: string; totalVotos: number }[],
  b: { unidadeId: string; totalVotos: number }[],
): boolean {
  const mb = new Map(b.map((x) => [x.unidadeId, x.totalVotos]))
  return a.every((x) => mb.get(x.unidadeId) === x.totalVotos)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
