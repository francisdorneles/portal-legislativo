import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'

/**
 * Lista cidadãos do gabinete da sessão. O isolamento é AUTOMÁTICO: withTenant ativa o
 * contexto e a extensão do Prisma injeta o gabineteId — a query aqui não filtra à mão.
 */
export type Paginado<T> = { items: T[]; total: number; page: number; perPage: number; totalPages: number }

export async function listarCidadaos(
  { q = '', page = 1, perPage = 10 }: { q?: string; page?: number; perPage?: number } = {},
) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return withTenant(session.tenant, async () => {
    const where = q
      ? {
          OR: [
            { nome: { contains: q, mode: 'insensitive' as const } },
            { bairro: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}
    const [items, total] = await Promise.all([
      prisma.cidadao.findMany({ where, orderBy: { nome: 'asc' }, skip: (page - 1) * perPage, take: perPage }),
      prisma.cidadao.count({ where }),
    ])
    return { items, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) }
  })
}

/** Busca um cidadão do gabinete da sessão. findFirst (não findUnique) p/ a extensão poder
 *  combinar id + gabineteId no where — id de outro gabinete retorna null. */
export async function buscarCidadao(id: string) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return withTenant(session.tenant, () => prisma.cidadao.findFirst({ where: { id } }))
}

// Sugestões iniciais só pra dar partida — o gabinete cria as suas livremente.
const SUGESTOES_PADRAO = ['saúde', 'asfalto', 'iluminação', 'educação', 'segurança', 'rural', 'assistência social']

/** Tags do gabinete: as já usadas (vocabulário real) + sugestões iniciais, sem duplicar. */
export async function listarSugestoesTags(): Promise<string[]> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  const cidadaos = await withTenant(session.tenant, () =>
    prisma.cidadao.findMany({ select: { tags: true } }),
  )
  const usadas = new Set<string>(SUGESTOES_PADRAO)
  for (const c of cidadaos) for (const t of c.tags) usadas.add(t)
  return [...usadas].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
