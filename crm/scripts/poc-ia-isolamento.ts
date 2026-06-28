/**
 * PoC Fase 3 (IA) — isolamento do RAG (busca semântica) por gabinete.
 *
 * Roda com o provedor de embedding STUB (offline, determinístico) — não precisa de
 * modelo/chave. Prova que a busca semântica:
 *   1. indexa demandas do gabinete A1 (gabineteId preenchido = privado)
 *   2. enxerga, no contexto de A1, as demandas de A1 + o doc compartilhado da câmara (null)
 *   3. NO contexto de A2 (mesma câmara, outro gabinete), vê o compartilhado mas NÃO as de A1
 *   4. NO contexto de outra câmara (B), não vê nada da câmara de A
 *
 * Roda: pnpm poc:ia   (precisa do banco com pgvector). ⚠️ Limpa dados — rode pnpm db:seed depois.
 */
import { randomUUID } from 'node:crypto'
import { prisma } from '../src/lib/prisma.js'
import { runComTenant } from '../src/lib/tenant-context.js'
import { embed, vetorLiteral } from '../src/modules/ia/gateway.js'
import { indexarDemandasDoGabinete } from '../src/modules/ia/indexar.js'
import { buscarSemelhantes } from '../src/modules/ia/busca.js'

function check(nome: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${nome}`)
  if (!ok) process.exitCode = 1
}

async function main() {
  // limpeza FK-safe
  await prisma.$executeRawUnsafe('DELETE FROM "Embedding"')
  await prisma.movimentacaoDemanda.deleteMany({})
  await prisma.demanda.deleteMany({})
  await prisma.comunicacaoEnviada.deleteMany({})
  await prisma.alerta.deleteMany({})
  await prisma.documentoGabinete.deleteMany({})
  await prisma.cidadao.deleteMany({})
  await prisma.usuario.deleteMany({})
  await prisma.unidadeTerritorial.deleteMany({})
  await prisma.resultadoEleitoral.deleteMany({})
  await prisma.gabinete.deleteMany({})
  await prisma.camara.deleteMany({})

  const camA = await prisma.camara.create({ data: { nome: 'Câmara A', municipio: 'Taquari', uf: 'RS' } })
  const camB = await prisma.camara.create({ data: { nome: 'Câmara B', municipio: 'Outra', uf: 'RS' } })
  const a1 = await prisma.gabinete.create({ data: { camaraId: camA.id, nome: 'Gab A1' } })
  const a2 = await prisma.gabinete.create({ data: { camaraId: camA.id, nome: 'Gab A2' } })
  const b1 = await prisma.gabinete.create({ data: { camaraId: camB.id, nome: 'Gab B1' } })

  const ctxA1 = { camaraId: camA.id, gabineteId: a1.id }
  const ctxA2 = { camaraId: camA.id, gabineteId: a2.id }
  const ctxB1 = { camaraId: camB.id, gabineteId: b1.id }

  // demandas privadas do A1
  await runComTenant(ctxA1, async () => {
    await prisma.demanda.create({ data: { titulo: 'Buraco na Rua Sete', tema: 'asfalto', bairro: 'Centro' } as never })
    await prisma.demanda.create({ data: { titulo: 'Poste queimado no São João', tema: 'iluminação', bairro: 'São João' } as never })
  })

  // doc compartilhado da câmara A (gabineteId NULL) — ex.: uma norma
  const [vShared] = await embed(['Lei municipal de iluminação pública de Taquari'])
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Embedding" (id,"camaraId","gabineteId",origem,"referenciaId",texto,vetor)
     VALUES ($1,$2,NULL,'norma','norma-1',$3,$4::vector)`,
    randomUUID(), camA.id, 'Lei de iluminação pública', vetorLiteral(vShared),
  )

  // 1. indexa demandas do A1
  const resumo = await runComTenant(ctxA1, async () => await indexarDemandasDoGabinete())
  check(`1. indexou ${resumo.indexados} demandas do A1`, resumo.indexados === 2)

  // 2. busca no A1 vê demandas do A1 + compartilhado
  const rA1 = await runComTenant(ctxA1, async () => await buscarSemelhantes('problema de iluminação', 20))
  const origensA1 = new Set(rA1.map((t) => t.origem))
  check(`2. A1 vê suas demandas + compartilhado (${rA1.length} trechos)`,
    rA1.some((t) => t.origem === 'demanda') && rA1.some((t) => t.origem === 'norma'))

  // 3. busca no A2 (mesma câmara, outro gabinete) vê SÓ o compartilhado
  const rA2 = await runComTenant(ctxA2, async () => await buscarSemelhantes('problema de iluminação', 20))
  check('3. A2 vê o compartilhado mas NÃO as demandas do A1',
    rA2.every((t) => t.origem !== 'demanda') && rA2.some((t) => t.origem === 'norma'))

  // 4. busca em outra câmara (B) não vê nada da câmara A
  const rB = await runComTenant(ctxB1, async () => await buscarSemelhantes('problema de iluminação', 20))
  check('4. Câmara B não vê nada da câmara A', rB.length === 0)

  console.log(`\n   (info) origens A1=${[...origensA1].join(',')} | A2=${rA2.length} trechos | B=${rB.length} trechos`)

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  PoC FALHOU — isolamento do RAG NÃO confirmado.' : '\n🎉 RAG isolado por gabinete confirmado.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
