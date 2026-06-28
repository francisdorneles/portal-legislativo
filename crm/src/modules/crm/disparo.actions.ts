'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import { enfileirarComunicacao } from '@/lib/queue'

/**
 * Dispara uma comunicação para todos os contatos que casam com o filtro (tags/bairro).
 * Cria um ComunicacaoEnviada por contato e enfileira cada um. O envio real é do worker.
 */
export async function dispararSegmentado(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')

  const mensagem = String(formData.get('mensagem') ?? '').trim()
  if (!mensagem) throw new Error('mensagem obrigatória')

  const tags = String(formData.get('tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean)
  const bairro = String(formData.get('bairro') ?? '').trim() || undefined

  const where: { tags?: { hasSome: string[] }; bairro?: { contains: string; mode: 'insensitive' } } = {}
  if (tags.length) where.tags = { hasSome: tags }
  if (bairro) where.bairro = { contains: bairro, mode: 'insensitive' }

  const ids: string[] = await withTenant(session.tenant, async () => {
    const alvos = await prisma.cidadao.findMany({ where, select: { id: true } })
    const criados: string[] = []
    for (const c of alvos) {
      const com = await prisma.comunicacaoEnviada.create({
        data: { cidadaoId: c.id, tipo: 'boletim', conteudo: mensagem } as never,
      })
      criados.push(com.id)
    }
    return criados
  })

  // enfileira fora do contexto (Redis). Se cair, ficam registradas e reenviáveis.
  for (const comunicacaoId of ids) {
    try {
      await enfileirarComunicacao({ comunicacaoId, camaraId: session.tenant.camaraId, gabineteId: session.tenant.gabineteId })
    } catch (e) {
      console.error('falha ao enfileirar disparo (segue registrado):', e)
    }
  }

  revalidatePath('/dashboard/comunicacoes')
  redirect('/dashboard/comunicacoes')
}
