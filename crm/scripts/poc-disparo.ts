/**
 * PoC do disparo segmentado: filtra por tag, cria 1 comunicação por alvo, isolado por gabinete.
 * Roda: pnpm tsx scripts/poc-disparo.ts  (banco no ar)
 */
import { prisma } from '../src/lib/prisma.js'
import { withTenant } from '../src/lib/with-tenant.js'

const ok = (n: string, c: boolean) => { console.log(`${c ? '✅' : '❌'} ${n}`); if (!c) process.exitCode = 1 }

async function main() {
  const cam = await prisma.camara.findFirst({})
  const gabA = await prisma.gabinete.findFirst({ where: { camaraId: cam!.id } })
  const gabB = await prisma.gabinete.findFirst({ where: { camaraId: cam!.id, NOT: { id: gabA!.id } } })
  const ctxA = { camaraId: cam!.id, gabineteId: gabA!.id }
  const ctxB = { camaraId: cam!.id, gabineteId: gabB!.id }

  // 3 no A: 2 com tag 'saúde', 1 sem. 1 no B com 'saúde' (não deve ser atingido)
  const feitos = await Promise.all([
    prisma.cidadao.create({ data: { camaraId: cam!.id, gabineteId: gabA!.id, nome: 'A1', tags: ['saúde'] } }),
    prisma.cidadao.create({ data: { camaraId: cam!.id, gabineteId: gabA!.id, nome: 'A2', tags: ['saúde', 'asfalto'] } }),
    prisma.cidadao.create({ data: { camaraId: cam!.id, gabineteId: gabA!.id, nome: 'A3', tags: ['asfalto'] } }),
    prisma.cidadao.create({ data: { camaraId: cam!.id, gabineteId: gabB!.id, nome: 'B1', tags: ['saúde'] } }),
  ])
  const ids = feitos.map((c) => c.id)

  // disparo no A para tag 'saúde' (replica a lógica da action)
  const criados = await withTenant(ctxA, async () => {
    const alvos = await prisma.cidadao.findMany({ where: { tags: { hasSome: ['saúde'] } }, select: { id: true } })
    const out: string[] = []
    for (const c of alvos) {
      const com = await prisma.comunicacaoEnviada.create({ data: { cidadaoId: c.id, tipo: 'boletim', conteudo: 'Boletim de saúde' } as never })
      out.push(com.id)
    }
    return out
  })
  ok('1. atingiu só os 2 do gabinete A com a tag', criados.length === 2)

  // gabinete B não recebe nada do disparo do A
  const comsB = await withTenant(ctxB, () => prisma.comunicacaoEnviada.findMany({ where: { tipo: 'boletim' } }))
  ok('2. gabinete B não recebeu o disparo do A', comsB.length === 0)

  // limpeza
  await prisma.comunicacaoEnviada.deleteMany({ where: { cidadaoId: { in: ids } } })
  await prisma.cidadao.deleteMany({ where: { id: { in: ids } } })
  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️ Disparo FALHOU' : '\n🎉 Disparo OK')
}
main().catch((e) => { console.error(e); process.exit(1) })
