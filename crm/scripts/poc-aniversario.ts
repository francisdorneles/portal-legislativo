/**
 * PoC dos aniversários: gera alerta p/ quem faz aniversário hoje, não p/ outro dia, não duplica.
 * Roda: pnpm tsx scripts/poc-aniversario.ts  (banco no ar)
 */
import { prisma } from '../src/lib/prisma.js'
import { scanAniversariantes } from '../src/modules/crm/aniversario.worker-core.js'

const ok = (n: string, c: boolean) => { console.log(`${c ? '✅' : '❌'} ${n}`); if (!c) process.exitCode = 1 }

async function main() {
  const cam = await prisma.camara.findFirst({})
  const gab = await prisma.gabinete.findFirst({ where: { camaraId: cam!.id } })
  const hoje = new Date()

  // nasceu hoje (outro ano) → aniversariante
  const aniv = new Date(Date.UTC(1985, hoje.getUTCMonth(), hoje.getUTCDate()))
  // nasceu "amanhã" → não é hoje
  const amanha = new Date(hoje.getTime() + 86_400_000)
  const outro = new Date(Date.UTC(1990, amanha.getUTCMonth(), amanha.getUTCDate()))

  const a = await prisma.cidadao.create({ data: { camaraId: cam!.id, gabineteId: gab!.id, nome: 'Aniversariante Hoje', nascimento: aniv } })
  const b = await prisma.cidadao.create({ data: { camaraId: cam!.id, gabineteId: gab!.id, nome: 'Outro Dia', nascimento: outro } })
  await prisma.alerta.deleteMany({ where: { cidadaoId: { in: [a.id, b.id] } } })

  await scanAniversariantes(hoje)
  const alertaA = await prisma.alerta.findFirst({ where: { cidadaoId: a.id, tipo: 'aniversario' } })
  const alertaB = await prisma.alerta.findFirst({ where: { cidadaoId: b.id, tipo: 'aniversario' } })
  ok('1. alerta para aniversariante de hoje', alertaA != null)
  ok('2. nada para quem não faz aniversário hoje', alertaB == null)

  await scanAniversariantes(hoje)
  const qtd = await prisma.alerta.count({ where: { cidadaoId: a.id, tipo: 'aniversario' } })
  ok('3. não duplica no mesmo ano', qtd === 1)

  await prisma.alerta.deleteMany({ where: { cidadaoId: { in: [a.id, b.id] } } })
  await prisma.cidadao.deleteMany({ where: { id: { in: [a.id, b.id] } } })
  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️ Aniversário FALHOU' : '\n🎉 Aniversário OK')
}
main().catch((e) => { console.error(e); process.exit(1) })
