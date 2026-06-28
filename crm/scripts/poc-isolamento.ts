/**
 * PoC do risco #3 — isolamento multi-tenant por gabinete.
 *
 * Prova que, com a Prisma Extension ativa:
 *   1. create dentro do contexto do Gabinete A grava com gabineteId A
 *   2. findMany no contexto do Gabinete B NÃO vê o cidadão do A
 *   3. findUnique do id do A no contexto do B retorna null (isolado)
 *   4. update do id do A no contexto do B NÃO altera nada (escrita cruzada bloqueada)
 *   5. SEM contexto, seed/admin enxerga tudo (esperado)
 *
 * Roda: pnpm poc:isolamento  (precisa do banco no ar: pnpm db:up && pnpm db:push)
 */
import { prisma } from '../src/lib/prisma.js'
import { runComTenant } from '../src/lib/tenant-context.js'

function check(nome: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${nome}`)
  if (!ok) process.exitCode = 1
}

async function main() {
  // Limpeza (sem contexto = admin)
  await prisma.cidadao.deleteMany({})
  await prisma.usuario.deleteMany({})
  await prisma.gabinete.deleteMany({})
  await prisma.camara.deleteMany({})

  // Seed da tenancy (sem contexto — modelos não isolados)
  const camara = await prisma.camara.create({
    data: { nome: 'Câmara de Taquari', municipio: 'Taquari', uf: 'RS' },
  })
  const gabA = await prisma.gabinete.create({ data: { camaraId: camara.id, nome: 'Gabinete A' } })
  const gabB = await prisma.gabinete.create({ data: { camaraId: camara.id, nome: 'Gabinete B' } })

  const ctxA = { camaraId: camara.id, gabineteId: gabA.id }
  const ctxB = { camaraId: camara.id, gabineteId: gabB.id }

  // NOTA: o await fica DENTRO do runComTenant — as promises do Prisma são lazy e o
  // isolamento (AsyncLocalStorage) precisa estar ativo no momento da execução, não só
  // na criação da promise. Em produção o wrapper de request deve envolver o await.

  // 1. create no contexto A
  const cidA = await runComTenant(ctxA, async () =>
    await prisma.cidadao.create({ data: { nome: 'Cidadão do A' } as any }),
  )
  check('1. create no A grava gabineteId A', cidA.gabineteId === gabA.id && cidA.camaraId === camara.id)

  // cidadão do B, pra garantir que A também não vê o do B
  await runComTenant(ctxB, async () => await prisma.cidadao.create({ data: { nome: 'Cidadão do B' } as any }))

  // 2. findMany no B não vê o do A
  const listaB = await runComTenant(ctxB, async () => await prisma.cidadao.findMany({}))
  check('2. findMany no B não vê cidadão do A', listaB.every((c) => c.gabineteId === gabB.id) && listaB.length === 1)

  // 3. findUnique do id do A no contexto B → null
  const vazA = await runComTenant(ctxB, async () => await prisma.cidadao.findUnique({ where: { id: cidA.id } }))
  check('3. findUnique do id do A no B retorna null', vazA === null)

  // 4. update cruzado bloqueado
  const upd = await runComTenant(ctxB, async () =>
    await prisma.cidadao.updateMany({ where: { id: cidA.id }, data: { nome: 'HACKEADO' } }),
  )
  const cidAdepois = await runComTenant(ctxA, async () => await prisma.cidadao.findUnique({ where: { id: cidA.id } }))
  check('4. update do id do A no B não altera nada', upd.count === 0 && cidAdepois?.nome === 'Cidadão do A')

  // 5. sem contexto, admin vê os 2
  const todos = await prisma.cidadao.findMany({})
  check('5. sem contexto (admin) vê os 2 cidadãos', todos.length === 2)

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  ISOLAMENTO FALHOU — risco #3 NÃO confirmado.' : '\n🎉 Isolamento OK — risco #3 confirmado.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
