import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import type { TenantContext } from '@/lib/tenant-context'

async function tenant(): Promise<TenantContext> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return session.tenant
}

export type Paginado<T> = { items: T[]; total: number; page: number; perPage: number; totalPages: number }

/** Demandas do gabinete da sessão (busca + paginação), com o cidadão. Isolada pela extensão. */
export async function listarDemandas(
  { q = '', page = 1, perPage = 10 }: { q?: string; page?: number; perPage?: number } = {},
) {
  return withTenant(await tenant(), async () => {
    const where = q
      ? {
          OR: [
            { titulo: { contains: q, mode: 'insensitive' as const } },
            { tema: { contains: q, mode: 'insensitive' as const } },
            { bairro: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}
    const [items, total] = await Promise.all([
      prisma.demanda.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { cidadao: { select: { nome: true } } },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.demanda.count({ where }),
    ])
    return { items, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) }
  })
}

/** Uma demanda do gabinete da sessão, com cidadão e histórico de movimentações. */
export async function buscarDemanda(id: string) {
  return withTenant(await tenant(), () =>
    prisma.demanda.findFirst({
      where: { id },
      include: {
        cidadao: { select: { id: true, nome: true } },
        movimentacoes: { orderBy: { createdAt: 'desc' } },
      },
    }),
  )
}

/** Demandas com coordenadas, para o mapa. Isolada. */
export async function listarDemandasComLocal() {
  return withTenant(await tenant(), () =>
    prisma.demanda.findMany({
      where: { lat: { not: null }, lng: { not: null } },
      select: { id: true, titulo: true, status: true, lat: true, lng: true, bairro: true },
    }),
  )
}

/** Cidadãos para o select do formulário de demanda (id + nome). */
export async function listarCidadaosParaSelect() {
  return withTenant(await tenant(), () =>
    prisma.cidadao.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
  )
}
