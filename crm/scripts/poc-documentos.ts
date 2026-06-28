/**
 * PoC documentos: avulso + mala direta (1 por contato, {nome} substituído), isolado.
 * Roda: pnpm tsx scripts/poc-documentos.ts  (banco no ar)
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

  const c1 = await prisma.cidadao.create({ data: { camaraId: cam!.id, gabineteId: gabA!.id, nome: 'Carlos', tags: ['evento'] } })
  const c2 = await prisma.cidadao.create({ data: { camaraId: cam!.id, gabineteId: gabA!.id, nome: 'Diana', tags: ['evento'] } })

  // mala direta no A para tag 'evento'
  await withTenant(ctxA, async () => {
    const alvos = await prisma.cidadao.findMany({ where: { tags: { hasSome: ['evento'] } }, select: { id: true, nome: true } })
    for (const c of alvos) {
      await prisma.documentoGabinete.create({ data: { tipo: 'carta', destinatario: c.nome, cidadaoId: c.id, conteudo: `Prezado(a) {nome}, convite.`.replaceAll('{nome}', c.nome) } as never })
    }
  })

  const docsA = await withTenant(ctxA, () => prisma.documentoGabinete.findMany({ where: { tipo: 'carta' } }))
  ok('1. mala direta gerou 1 doc por contato', docsA.length === 2)
  ok('2. {nome} substituído', docsA.some((d) => d.conteudo.includes('Carlos')) && docsA.some((d) => d.conteudo.includes('Diana')))

  const docsB = await withTenant(ctxB, () => prisma.documentoGabinete.findMany({ where: { tipo: 'carta' } }))
  ok('3. gabinete B não vê os documentos do A', docsB.length === 0)

  // limpeza
  await prisma.documentoGabinete.deleteMany({ where: { cidadaoId: { in: [c1.id, c2.id] } } })
  await prisma.cidadao.deleteMany({ where: { id: { in: [c1.id, c2.id] } } })
  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️ Documentos FALHOU' : '\n🎉 Documentos OK')
}
main().catch((e) => { console.error(e); process.exit(1) })
