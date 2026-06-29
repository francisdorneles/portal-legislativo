/**
 * Cria o primeiro usuário admin do Payload de forma controlada (idempotente).
 * Rodar: ADMIN_EMAIL=... ADMIN_SENHA=... pnpm payload run scripts/criar-admin.ts
 *
 * Fecha a janela de "primeiro usuário" do painel: depois disso, /admin mostra
 * tela de LOGIN (não de cadastro).
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const criar = async () => {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_SENHA
  if (!email || !password) {
    console.error('Faltam ADMIN_EMAIL e/ou ADMIN_SENHA no ambiente.')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const existe = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })

  if (existe.docs.length > 0) {
    console.log(`Usuário ${email} já existe — nada a fazer.`)
    process.exit(0)
  }

  await payload.create({ collection: 'users', data: { email, password } })
  console.log(`Admin criado: ${email}`)
  process.exit(0)
}

await criar()
