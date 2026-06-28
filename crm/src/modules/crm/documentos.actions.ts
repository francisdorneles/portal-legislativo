'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'

/** Cria um documento avulso. */
export async function criarDocumento(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')

  const conteudo = String(formData.get('conteudo') ?? '').trim()
  if (!conteudo) throw new Error('conteúdo obrigatório')

  await withTenant(session.tenant, () =>
    prisma.documentoGabinete.create({
      data: {
        tipo: String(formData.get('tipo') ?? 'ofício').trim() || 'ofício',
        numero: String(formData.get('numero') ?? '').trim() || null,
        destinatario: String(formData.get('destinatario') ?? '').trim() || null,
        conteudo,
      } as never,
    }),
  )
  revalidatePath('/dashboard/documentos')
  redirect('/dashboard/documentos')
}

/**
 * Mala direta: gera um documento por contato de um segmento (tags/bairro), substituindo
 * {nome} no modelo pelo nome do contato. Isolado por gabinete.
 */
export async function malaDireta(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')

  const modelo = String(formData.get('conteudo') ?? '').trim()
  if (!modelo) throw new Error('modelo obrigatório')
  const tipo = String(formData.get('tipo') ?? 'carta').trim() || 'carta'

  const tags = String(formData.get('tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean)
  const bairro = String(formData.get('bairro') ?? '').trim() || undefined

  const where: { tags?: { hasSome: string[] }; bairro?: { contains: string; mode: 'insensitive' } } = {}
  if (tags.length) where.tags = { hasSome: tags }
  if (bairro) where.bairro = { contains: bairro, mode: 'insensitive' }

  await withTenant(session.tenant, async () => {
    const alvos = await prisma.cidadao.findMany({ where, select: { id: true, nome: true } })
    for (const c of alvos) {
      await prisma.documentoGabinete.create({
        data: {
          tipo,
          destinatario: c.nome,
          cidadaoId: c.id,
          conteudo: modelo.replaceAll('{nome}', c.nome),
        } as never,
      })
    }
  })
  revalidatePath('/dashboard/documentos')
  redirect('/dashboard/documentos')
}
