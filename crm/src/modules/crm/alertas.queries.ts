import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'

/** Alertas pendentes (não lidos) do gabinete da sessão. Isolado. */
export async function listarAlertasPendentes() {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return withTenant(session.tenant, () =>
    prisma.alerta.findMany({
      where: { lidoEm: null },
      orderBy: { createdAt: 'desc' },
      include: { cidadao: { select: { id: true, nome: true } } },
    }),
  )
}
