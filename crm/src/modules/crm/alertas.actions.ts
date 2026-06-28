'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'

/** Marca um alerta como lido. Isolado: where leva só o id, extensão injeta o gabinete. */
export async function marcarAlertaLido(id: string) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  await withTenant(session.tenant, () =>
    prisma.alerta.updateMany({ where: { id }, data: { lidoEm: new Date() } }),
  )
  revalidatePath('/dashboard')
}
