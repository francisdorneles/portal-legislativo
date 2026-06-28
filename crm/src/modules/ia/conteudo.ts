'use server'

/**
 * Persistência de artefatos da IA (agenda da semana, varredura do diário, dossiês).
 * Isolado por gabinete (ConteudoIA, escopo gabinete). Sobrevive à navegação.
 */
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'

export type ConteudoSalvo<T = unknown> = { conteudo: string; dados: T | null; createdAt: string } | null

export async function salvarConteudoIA(
  tipo: string,
  conteudo: string,
  dados?: unknown,
  opts?: { titulo?: string; substituir?: boolean },
): Promise<void> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  await withTenant(session.tenant, async () => {
    // substituir = mantém só UM artefato deste tipo no gabinete (ex.: agenda da semana)
    if (opts?.substituir) await prisma.conteudoIA.deleteMany({ where: { tipo } })
    await prisma.conteudoIA.create({ data: { tipo, conteudo, titulo: opts?.titulo ?? null, dados: (dados ?? null) as never } as never })
  })
}

export async function ultimoConteudoIA<T = unknown>(tipo: string): Promise<ConteudoSalvo<T>> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return withTenant(session.tenant, async () => {
    const c = await prisma.conteudoIA.findFirst({ where: { tipo }, orderBy: { createdAt: 'desc' } })
    return c ? { conteudo: c.conteudo, dados: (c.dados as T) ?? null, createdAt: c.createdAt.toISOString() } : null
  })
}
