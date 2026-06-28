/**
 * PoC do login (e-mail+senha) integrado ao isolamento.
 * Prova: senha errada é rejeitada; senha certa devolve o tenant do usuário; e ao rodar
 * sob esse tenant, o isolamento da Fase 0 continua valendo (usuário só vê seu gabinete).
 *
 * Roda: pnpm poc:auth  (precisa do banco no ar: pnpm db:up && pnpm db:push)
 */
import { prisma } from '../src/lib/prisma.js'
import { withTenant } from '../src/lib/with-tenant.js'
import { hashSenha, verificarCredenciais } from '../src/modules/auth/auth-core.js'

function check(nome: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${nome}`)
  if (!ok) process.exitCode = 1
}

async function main() {
  await prisma.cidadao.deleteMany({})
  await prisma.usuario.deleteMany({})
  await prisma.gabinete.deleteMany({})
  await prisma.camara.deleteMany({})

  const camara = await prisma.camara.create({
    data: { nome: 'Câmara de Taquari', municipio: 'Taquari', uf: 'RS' },
  })
  const gabA = await prisma.gabinete.create({ data: { camaraId: camara.id, nome: 'Gabinete A' } })
  const gabB = await prisma.gabinete.create({ data: { camaraId: camara.id, nome: 'Gabinete B' } })

  await prisma.usuario.create({
    data: {
      camaraId: camara.id, gabineteId: gabA.id,
      email: 'vereador.a@taquari.rs', nome: 'Vereador A',
      senhaHash: await hashSenha('senha-correta-A'),
    },
  })

  // cidadão de cada gabinete (seed admin, sem contexto)
  await prisma.cidadao.create({ data: { camaraId: camara.id, gabineteId: gabA.id, nome: 'Cidadão do A' } })
  await prisma.cidadao.create({ data: { camaraId: camara.id, gabineteId: gabB.id, nome: 'Cidadão do B' } })

  // 1. senha errada → null
  check('1. senha errada é rejeitada', (await verificarCredenciais('vereador.a@taquari.rs', 'xxx')) === null)

  // 2. e-mail inexistente → null
  check('2. e-mail inexistente é rejeitado', (await verificarCredenciais('ninguem@x', 'y')) === null)

  // 3. senha certa → sessão com tenant do gabinete A
  const sess = await verificarCredenciais('vereador.a@taquari.rs', 'senha-correta-A')
  check('3. login válido devolve tenant do gabinete A', sess?.gabineteId === gabA.id && sess?.camaraId === camara.id)

  // 4. rodando sob a sessão, só vê o cidadão do próprio gabinete
  const lista = await withTenant(sess!, () => prisma.cidadao.findMany({}))
  check('4. sessão isola: vê só o cidadão do gabinete A', lista.length === 1 && lista[0].nome === 'Cidadão do A')

  await prisma.$disconnect()
  console.log(process.exitCode ? '\n⚠️  Auth+isolamento FALHOU.' : '\n🎉 Login+isolamento OK.')
}

main().catch((e) => { console.error(e); process.exit(1) })
