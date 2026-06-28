/**
 * Cria (ou atualiza a senha de) um usuário de login do CRM.
 *
 * Uso:
 *   pnpm user:criar <email> <senha> "<nome>" [gabineteId]
 *
 * Exemplos:
 *   pnpm user:criar maria@taquari.rs minhaSenha123 "Maria Vereadora"
 *   pnpm user:criar joao@taquari.rs  segredo456    "João"            <gabineteId>
 *
 * Se [gabineteId] for omitido e houver só 1 gabinete, usa esse. Se houver vários,
 * lista os ids e pede pra você escolher. Se o e-mail já existir, só troca a senha/nome.
 */
import { PrismaClient } from '@prisma/client'
import { hashSenha } from '../src/modules/auth/auth-core.js'

const prisma = new PrismaClient()

async function main() {
  const [email, senha, nome, gabineteIdArg] = process.argv.slice(2)
  if (!email || !senha || !nome) {
    console.error('Uso: pnpm user:criar <email> <senha> "<nome>" [gabineteId]')
    process.exit(1)
  }

  let gabineteId = gabineteIdArg
  if (!gabineteId) {
    const gabinetes = await prisma.gabinete.findMany({ include: { camara: true } })
    if (gabinetes.length === 0) {
      console.error('Nenhum gabinete cadastrado. Rode `pnpm db:seed` primeiro ou crie um gabinete.')
      process.exit(1)
    }
    if (gabinetes.length > 1) {
      console.error('Vários gabinetes — informe o gabineteId:')
      for (const g of gabinetes) console.error(`  ${g.id}  →  ${g.camara.nome} / ${g.nome}`)
      process.exit(1)
    }
    gabineteId = gabinetes[0].id
  }

  const gab = await prisma.gabinete.findUnique({ where: { id: gabineteId } })
  if (!gab) {
    console.error(`gabineteId inválido: ${gabineteId}`)
    process.exit(1)
  }

  const senhaHash = await hashSenha(senha)
  const u = await prisma.usuario.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { nome, senhaHash, ativo: true, gabineteId: gab.id, camaraId: gab.camaraId },
    create: { email: email.toLowerCase().trim(), nome, senhaHash, gabineteId: gab.id, camaraId: gab.camaraId },
  })

  console.log(`OK: usuário ${u.email} (${u.nome}) no gabinete ${gabineteId}.`)
  console.log(`Login: ${u.email} / a senha que você definiu`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
