/**
 * PoC da Fase 2 (Radar) — import do TSE + isolamento multi-tenant por CÂMARA.
 *
 * ResultadoEleitoral é escopo 'camara'. Prova que:
 *   1. o parser lê o CSV real do TSE (latin1, ;-delimitado) e produz linhas
 *   2. import no contexto da Câmara A grava com camaraId A
 *   3. findMany no contexto da Câmara B NÃO vê resultados da A
 *   4. deleteMany no contexto da B NÃO apaga resultados da A (escrita cruzada bloqueada)
 *   5. reimport na A é idempotente (limpa o ano/cargo antes de inserir — não duplica)
 *   6. SEM contexto (admin) enxerga tudo
 *
 * Roda: pnpm poc:radar   (precisa do banco: pnpm db:up && pnpm db:push)
 * ⚠️ Limpa o banco — rode `pnpm db:seed` depois.
 */
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma.js'
import { runComTenant } from '../src/lib/tenant-context.js'
import { lerCsvTse, importarResultadosTse } from '../src/modules/radar/tse-import.js'

const CSV = resolve(process.cwd(), 'spike-crm/amostras/tse-secao-taquari-vereador-2024.csv')

function check(nome: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${nome}`)
  if (!ok) process.exitCode = 1
}

async function main() {
  // limpeza (sem contexto = admin) — ordem FK-safe: filhos antes dos pais
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

  // 1. parser lê o CSV real
  const linhas = lerCsvTse(CSV)
  check(`1. parser leu o CSV do TSE (${linhas.length} linhas)`, linhas.length > 1000)
  const amostra = linhas[0]
  console.log('   amostra:', JSON.stringify(amostra))

  // 2. import no contexto da Câmara A
  const resumo = await runComTenant(ctxA, async () => await importarResultadosTse(linhas))
  const inseridos = resumo.reduce((s, r) => s + r.inseridos, 0)
  const totalA = await runComTenant(ctxA, async () => await prisma.resultadoEleitoral.count({}))
  check(`2. import na A gravou ${inseridos} resultados (camaraId A)`, totalA === linhas.length && inseridos === linhas.length)

  // 3. Câmara B não vê nada da A
  const totalB = await runComTenant(ctxB, async () => await prisma.resultadoEleitoral.count({}))
  check('3. findMany/count na B não vê resultados da A', totalB === 0)

  // 4. deleteMany cruzado bloqueado (B tenta apagar tudo)
  const del = await runComTenant(ctxB, async () => await prisma.resultadoEleitoral.deleteMany({}))
  const totalAdepois = await runComTenant(ctxA, async () => await prisma.resultadoEleitoral.count({}))
  check('4. deleteMany na B não apaga resultados da A', del.count === 0 && totalAdepois === linhas.length)

  // 5. reimport na A é idempotente (não duplica)
  await runComTenant(ctxA, async () => await importarResultadosTse(linhas))
  const totalAreimport = await runComTenant(ctxA, async () => await prisma.resultadoEleitoral.count({}))
  check('5. reimport na A não duplica (idempotente)', totalAreimport === linhas.length)

  // 6. admin (sem contexto) vê tudo
  const todos = await prisma.resultadoEleitoral.count({})
  check('6. sem contexto (admin) vê todos os resultados', todos === linhas.length)

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  PoC FALHOU — isolamento/import do Radar NÃO confirmado.' : '\n🎉 Radar OK — import do TSE isolado por câmara confirmado.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
