import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'

/** Comunicações registradas (prova de trabalho) do gabinete da sessão. Isolada. */
export async function listarComunicacoes() {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return withTenant(session.tenant, () =>
    prisma.comunicacaoEnviada.findMany({
      orderBy: { createdAt: 'desc' },
      include: { cidadao: { select: { nome: true } } },
    }),
  )
}
