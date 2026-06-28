/**
 * PoC Fase 2 (Radar) — agregação por bairro + isolamento multi-tenant por CÂMARA.
 *
 * UnidadeTerritorial e a leitura agregada (groupBy) são escopo 'camara'. Prova que:
 *   1. import + vínculo na Câmara A cria bairros e vincula resultados
 *   2. agregarVotosPorBairro na A soma corretamente (total = total importado)
 *   3. Câmara B NÃO vê bairros nem resultados da A (isolamento na leitura agregada)
 *   4. vínculo na A não criou UnidadeTerritorial visível para a B
 *   5. fallback por seção sempre funciona e isola
 *
 * Roda: pnpm poc:radar-bairro   (precisa do banco). ⚠️ Limpa o banco — rode pnpm db:seed depois.
 */
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma.js'
import { runComTenant } from '../src/lib/tenant-context.js'
import { lerCsvTse, importarResultadosTse } from '../src/modules/radar/tse-import.js'
import { lerTabelaLocais, lerPoligonosBairros, vincularLocaisABairros } from '../src/modules/radar/agregacao.js'
import { agregarVotosPorBairro, agregarVotosPorSecao } from '../src/modules/radar/radar.queries.js'

const CSV = resolve(process.cwd(), 'spike-crm/amostras/tse-secao-taquari-vereador-2024.csv')
const TABELA = resolve(process.cwd(), 'spike-crm/amostras/locais-votacao-taquari.json')
const POLIGONOS = resolve(process.cwd(), 'spike-crm/amostras/bairros-taquari.geojson')

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
  const totalImportado = linhas.reduce((s, l) => s + l.votos, 0)

  // 1. import + vínculo na A (com polígonos IBGE)
  const resumo = await runComTenant(ctxA, async () => {
    await importarResultadosTse(linhas)
    return await vincularLocaisABairros(tabela, poligonos)
  })
  check(`1. vínculo na A criou ${resumo.bairros} bairros e vinculou ${resumo.resultadosVinculados} resultados`,
    resumo.bairros > 0 && resumo.resultadosVinculados > 0)
  check(`1b. ${resumo.comPoligono} bairros receberam polígono IBGE`, resumo.comPoligono >= 9)

  // 2. soma por bairro na A == total importado (inclui "(sem bairro)")
  const bairrosA = await runComTenant(ctxA, async () => await agregarVotosPorBairro({ cargo: 'Vereador' }))
  const somaBairros = bairrosA.reduce((s, b) => s + b.votos, 0)
  check(`2. soma por bairro na A (${somaBairros}) == total importado (${totalImportado})`, somaBairros === totalImportado)

  // 3. Câmara B não vê bairros nem resultados da A
  const bairrosB = await runComTenant(ctxB, async () => await agregarVotosPorBairro({ cargo: 'Vereador' }))
  check('3. agregarVotosPorBairro na B vê 0 (isolado)', bairrosB.length === 0)

  // 4. UnidadeTerritorial isolada
  const unidadesB = await runComTenant(ctxB, async () => await prisma.unidadeTerritorial.count({}))
  const unidadesA = await runComTenant(ctxA, async () => await prisma.unidadeTerritorial.count({}))
  check(`4. UnidadeTerritorial: A vê ${unidadesA}, B vê 0`, unidadesA === resumo.bairros && unidadesB === 0)

  // 5. fallback por seção isola
  const secoesA = await runComTenant(ctxA, async () => await agregarVotosPorSecao({ cargo: 'Vereador' }))
  const secoesB = await runComTenant(ctxB, async () => await agregarVotosPorSecao({ cargo: 'Vereador' }))
  check('5. agregação por seção: A tem dados, B vê 0', secoesA.length > 0 && secoesB.length === 0)

  console.log(`\n   (info) bairros na A: ${bairrosA.length} | sem-bairro: ${bairrosA.find((b) => b.bairro === '(sem bairro)')?.votos ?? 0} votos`)

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  PoC FALHOU.' : '\n🎉 Agregação por bairro isolada por câmara confirmada.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
