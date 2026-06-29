/**
 * Promove um usuário existente a admin (idempotente).
 * Rodar: ADMIN_EMAIL=... pnpm payload run scripts/promover-admin.ts
 *
 * Em dev, o adapter postgres faz push do schema — aplica a coluna `role` nova
 * no banco antes de gravar.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const promover = async () => {
  const email = process.env.ADMIN_EMAIL
  if (!email) {
    console.error('Falta ADMIN_EMAIL no ambiente.')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })

  const u = res.docs[0] as { id: number | string } | undefined
  if (!u) {
    console.error(`Usuário ${email} não encontrado.`)
    process.exit(1)
  }

  await payload.update({ collection: 'users', id: u.id, data: { role: 'admin' } })
  console.log(`Usuário ${email} agora é admin.`)
  process.exit(0)
}

await promover()
