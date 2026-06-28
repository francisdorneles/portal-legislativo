import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import type { Prisma } from '@prisma/client'

export interface FiltroSegmento {
  tags?: string[]
  bairro?: string
}

function whereDoFiltro(filtro: FiltroSegmento): Prisma.CidadaoWhereInput {
  const where: Prisma.CidadaoWhereInput = {}
  if (filtro.tags && filtro.tags.length) where.tags = { hasSome: filtro.tags }
  if (filtro.bairro) where.bairro = { contains: filtro.bairro, mode: 'insensitive' }
  return where
}

/** Contatos que casam com o filtro (tags/bairro), do gabinete da sessão. Isolado. */
export async function contatosSegmentados(filtro: FiltroSegmento) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return withTenant(session.tenant, () =>
    prisma.cidadao.findMany({
      where: whereDoFiltro(filtro),
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, bairro: true, email: true, tags: true },
    }),
  )
}
