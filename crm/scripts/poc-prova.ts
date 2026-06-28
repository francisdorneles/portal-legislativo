/**
 * PoC da prova de trabalho: resolver demanda com cidadão → gera ComunicacaoEnviada;
 * resolver de novo não duplica; demanda sem cidadão não gera; gabinete B não vê.
 * Replica a lógica da action mudarStatusDemanda no caminho de dados.
 *
 * Roda: pnpm tsx scripts/poc-prova.ts  (banco no ar)
 */
import { prisma } from '../src/lib/prisma.js'
import { withTenant } from '../src/lib/with-tenant.js'
import type { StatusDemanda } from '@prisma/client'

function check(nome: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${nome}`)
  if (!ok) process.exitCode = 1
}

async function resolver(ctx: { camaraId: string; gabineteId: string }, id: string) {
  await withTenant(ctx, async () => {
    const atual = await prisma.demanda.findFirst({ where: { id }, select: { status: true, titulo: true, cidadaoId: true } })
    if (!atual) throw new Error('não achou')
    const ops: import('@prisma/client').Prisma.PrismaPromise<unknown>[] = [
      prisma.demanda.updateMany({ where: { id }, data: { status: 'RESOLVIDA' as StatusDemanda } }),
      prisma.movimentacaoDemanda.create({ data: { demandaId: id, de: atual.status, para: 'RESOLVIDA' } as never }),
    ]
    if (atual.status !== 'RESOLVIDA' && atual.cidadaoId) {
      ops.push(prisma.comunicacaoEnviada.create({ data: { cidadaoId: atual.cidadaoId, demandaId: id, tipo: 'demanda_resolvida', conteudo: `Sua demanda "${atual.titulo}" foi resolvida.` } as never }))
    }
    await prisma.$transaction(ops)
  })
}

async function main() {
  await prisma.comunicacaoEnviada.deleteMany({})
  await prisma.movimentacaoDemanda.deleteMany({})
  await prisma.demanda.deleteMany({})
  await prisma.cidadao.deleteMany({})
  await prisma.usuario.deleteMany({})
  await prisma.gabinete.deleteMany({})
  await prisma.camara.deleteMany({})

  const cam = await prisma.camara.create({ data: { nome: 'Taquari', municipio: 'Taquari', uf: 'RS' } })
  const gabA = await prisma.gabinete.create({ data: { camaraId: cam.id, nome: 'A' } })
  const gabB = await prisma.gabinete.create({ data: { camaraId: cam.id, nome: 'B' } })
  const ctxA = { camaraId: cam.id, gabineteId: gabA.id }
  const ctxB = { camaraId: cam.id, gabineteId: gabB.id }

  const cid = await prisma.cidadao.create({ data: { camaraId: cam.id, gabineteId: gabA.id, nome: 'Maria' } })
  const comCid = await prisma.demanda.create({ data: { camaraId: cam.id, gabineteId: gabA.id, titulo: 'Com cidadão', cidadaoId: cid.id } })
  const semCid = await prisma.demanda.create({ data: { camaraId: cam.id, gabineteId: gabA.id, titulo: 'Sem cidadão' } })

  await resolver(ctxA, comCid.id)
  let provas = await withTenant(ctxA, () => prisma.comunicacaoEnviada.findMany({}))
  check('1. resolver com cidadão gera 1 prova', provas.length === 1 && provas[0].tipo === 'demanda_resolvida')

  await resolver(ctxA, comCid.id) // de novo
  provas = await withTenant(ctxA, () => prisma.comunicacaoEnviada.findMany({}))
  check('2. resolver de novo não duplica', provas.length === 1)

  await resolver(ctxA, semCid.id)
  provas = await withTenant(ctxA, () => prisma.comunicacaoEnviada.findMany({}))
  check('3. resolver sem cidadão não gera prova', provas.length === 1)

  const provasB = await withTenant(ctxB, () => prisma.comunicacaoEnviada.findMany({}))
  check('4. gabinete B não vê a prova', provasB.length === 0)

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  Prova de trabalho FALHOU.' : '\n🎉 Prova de trabalho OK.')
}

main().catch((e) => { console.error(e); process.exit(1) })
