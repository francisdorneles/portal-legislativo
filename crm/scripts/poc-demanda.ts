/**
 * PoC do ciclo da demanda: criar → mudar status (transação update + movimentação) → histórico,
 * tudo sob o contexto de tenant. Confirma que a transação com a extensão de isolamento injeta
 * gabineteId/camaraId corretamente e que outro gabinete não enxerga nada.
 *
 * Roda: pnpm tsx scripts/poc-demanda.ts  (banco no ar)
 */
import { prisma } from '../src/lib/prisma.js'
import { withTenant } from '../src/lib/with-tenant.js'

function check(nome: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${nome}`)
  if (!ok) process.exitCode = 1
}

async function main() {
  await prisma.movimentacaoDemanda.deleteMany({})
  await prisma.demanda.deleteMany({})
  await prisma.cidadao.deleteMany({})
  await prisma.usuario.deleteMany({})
  await prisma.gabinete.deleteMany({})
  await prisma.camara.deleteMany({})

  const camara = await prisma.camara.create({ data: { nome: 'Taquari', municipio: 'Taquari', uf: 'RS' } })
  const gabA = await prisma.gabinete.create({ data: { camaraId: camara.id, nome: 'A' } })
  const gabB = await prisma.gabinete.create({ data: { camaraId: camara.id, nome: 'B' } })
  const ctxA = { camaraId: camara.id, gabineteId: gabA.id }
  const ctxB = { camaraId: camara.id, gabineteId: gabB.id }

  // cria demanda no A
  const dem = await withTenant(ctxA, () =>
    prisma.demanda.create({ data: { titulo: 'Buraco na rua', tema: 'asfalto' } as never }),
  )
  check('1. demanda criada no gabinete A', dem.gabineteId === gabA.id && dem.status === 'ABERTA')

  // muda status com histórico (replica a action: transação update + movimentação)
  await withTenant(ctxA, async () => {
    const atual = await prisma.demanda.findFirst({ where: { id: dem.id }, select: { status: true } })
    await prisma.$transaction([
      prisma.demanda.updateMany({ where: { id: dem.id }, data: { status: 'EM_ANDAMENTO' } }),
      prisma.movimentacaoDemanda.create({
        data: { demandaId: dem.id, de: atual!.status, para: 'EM_ANDAMENTO', nota: 'equipe acionada' } as never,
      }),
    ])
  })

  // segunda mudança → RESOLVIDA
  await withTenant(ctxA, async () => {
    await prisma.$transaction([
      prisma.demanda.updateMany({ where: { id: dem.id }, data: { status: 'RESOLVIDA' } }),
      prisma.movimentacaoDemanda.create({ data: { demandaId: dem.id, de: 'EM_ANDAMENTO', para: 'RESOLVIDA' } as never }),
    ])
  })

  const det = await withTenant(ctxA, () =>
    prisma.demanda.findFirst({ where: { id: dem.id }, include: { movimentacoes: { orderBy: { createdAt: 'asc' } } } }),
  )
  check('2. status final RESOLVIDA', det?.status === 'RESOLVIDA')
  check('3. histórico tem 2 movimentações na ordem', det?.movimentacoes.length === 2 && det.movimentacoes[0].para === 'EM_ANDAMENTO' && det.movimentacoes[1].para === 'RESOLVIDA')
  check('4. movimentação herdou o gabinete A', det?.movimentacoes.every((m) => m.gabineteId === gabA.id) ?? false)

  // gabinete B não vê a demanda nem o histórico
  const visB = await withTenant(ctxB, () => prisma.demanda.findFirst({ where: { id: dem.id } }))
  const movB = await withTenant(ctxB, () => prisma.movimentacaoDemanda.findMany({}))
  check('5. gabinete B não vê a demanda', visB === null)
  check('6. gabinete B não vê movimentações', movB.length === 0)

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  Ciclo da demanda FALHOU.' : '\n🎉 Ciclo da demanda OK.')
}

main().catch((e) => { console.error(e); process.exit(1) })
