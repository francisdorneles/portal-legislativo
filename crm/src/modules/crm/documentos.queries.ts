import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'

async function tenant() {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return session.tenant
}

export async function listarDocumentos() {
  return withTenant(await tenant(), () =>
    prisma.documentoGabinete.findMany({ orderBy: { createdAt: 'desc' } }),
  )
}

export async function buscarDocumento(id: string) {
  return withTenant(await tenant(), () =>
    prisma.documentoGabinete.findFirst({ where: { id } }),
  )
}
