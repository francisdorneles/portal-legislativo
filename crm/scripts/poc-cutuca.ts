/**
 * PoC da cutuca: gera alerta para contato esfriado, não duplica, e respeita o gabinete.
 * Roda: pnpm tsx scripts/poc-cutuca.ts  (banco no ar)
 */
import { prisma } from '../src/lib/prisma.js'
import { scanCutucaRelacionamento } from '../src/modules/crm/cutuca.worker-core.js'
import { LIMIAR_FRIO } from '../src/modules/crm/relacionamento.js'

const ok = (n: string, c: boolean) => { console.log(`${c ? '✅' : '❌'} ${n}`); if (!c) process.exitCode = 1 }

async function main() {
  const cam = await prisma.camara.findFirst({})
  const gabA = await prisma.gabinete.findFirst({ where: { camaraId: cam!.id } })

  // contato que esfriou (último contato bem antigo)
  const antigo = new Date(Date.now() - (LIMIAR_FRIO + 30) * 86_400_000)
  const frio = await prisma.cidadao.create({
    data: { camaraId: cam!.id, gabineteId: gabA!.id, nome: 'Contato Esfriado', ultimoContato: antigo },
  })
  // contato recente (não deve gerar alerta)
  const quente = await prisma.cidadao.create({
    data: { camaraId: cam!.id, gabineteId: gabA!.id, nome: 'Contato Recente', ultimoContato: new Date() },
  })

  await prisma.alerta.deleteMany({ where: { cidadaoId: { in: [frio.id, quente.id] } } })

  const c1 = await scanCutucaRelacionamento()
  const alerta = await prisma.alerta.findFirst({ where: { cidadaoId: frio.id, tipo: 'relacionamento_frio', lidoEm: null } })
  ok('1. gera alerta para o contato esfriado', c1 >= 1 && alerta != null)

  const semAlertaQuente = await prisma.alerta.findFirst({ where: { cidadaoId: quente.id } })
  ok('2. não alerta contato recente', semAlertaQuente == null)

  await scanCutucaRelacionamento()
  const qtd = await prisma.alerta.count({ where: { cidadaoId: frio.id, tipo: 'relacionamento_frio', lidoEm: null } })
  ok('3. não duplica (2º scan)', qtd === 1)

  // limpeza
  await prisma.alerta.deleteMany({ where: { cidadaoId: { in: [frio.id, quente.id] } } })
  await prisma.cidadao.deleteMany({ where: { id: { in: [frio.id, quente.id] } } })
  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️ Cutuca FALHOU' : '\n🎉 Cutuca OK')
}
main().catch((e) => { console.error(e); process.exit(1) })
