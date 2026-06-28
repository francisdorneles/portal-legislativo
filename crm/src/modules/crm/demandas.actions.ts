'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import type { StatusDemanda } from '@prisma/client'
import { enfileirarComunicacao } from '@/lib/queue'

const STATUS_VALIDOS: StatusDemanda[] = ['ABERTA', 'EM_ANDAMENTO', 'ENCAMINHADA', 'RESOLVIDA']

export async function criarDemanda(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')

  const titulo = String(formData.get('titulo') ?? '').trim()
  if (!titulo) throw new Error('título obrigatório')

  const statusRaw = String(formData.get('status') ?? 'ABERTA')
  const status = STATUS_VALIDOS.includes(statusRaw as StatusDemanda)
    ? (statusRaw as StatusDemanda)
    : 'ABERTA'

  const cidadaoId = String(formData.get('cidadaoId') ?? '').trim() || null

  const data = {
    titulo,
    descricao: String(formData.get('descricao') ?? '').trim() || null,
    tema: String(formData.get('tema') ?? '').trim() || null,
    bairro: String(formData.get('bairro') ?? '').trim() || null,
    status,
    cidadaoId,
  }

  // gabineteId/camaraId injetados pela extensão. Se cidadaoId for de outro gabinete, a
  // FK não resolve no contexto (o cidadão não é visível) — mantemos a checagem simples
  // criando a demanda; vínculo inválido falharia na constraint.
  await withTenant(session.tenant, () => prisma.demanda.create({ data: data as never }))
  revalidatePath('/dashboard/demandas')
  redirect('/dashboard/demandas')
}

/** Exclui uma demanda do gabinete da sessão. Isolada (deleteMany + extensão). */
export async function excluirDemanda(id: string) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  await withTenant(session.tenant, async () => {
    await prisma.movimentacaoDemanda.deleteMany({ where: { demandaId: id } })
    await prisma.demanda.deleteMany({ where: { id } })
  })
  revalidatePath('/dashboard/demandas')
}

/** Define a localização (lat/lng) de uma demanda. Isolada pela extensão. */
export async function definirLocalDemanda(id: string, lat: number, lng: number) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  await withTenant(session.tenant, () =>
    prisma.demanda.updateMany({ where: { id }, data: { lat, lng } }),
  )
  revalidatePath('/dashboard/mapa')
  revalidatePath(`/dashboard/demandas/${id}`)
}

/**
 * Muda o status de uma demanda e grava a movimentação no histórico (prova de trabalho).
 * O `where` leva só o id; a extensão injeta gabineteId → não mexe em demanda de outro gabinete.
 */
export async function mudarStatusDemanda(id: string, formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('não autenticado')

  const paraRaw = String(formData.get('status') ?? '')
  if (!STATUS_VALIDOS.includes(paraRaw as StatusDemanda)) throw new Error('status inválido')
  const para = paraRaw as StatusDemanda
  const nota = String(formData.get('nota') ?? '').trim() || null

  let comunicacaoId: string | null = null

  await withTenant(session.tenant, async () => {
    const atual = await prisma.demanda.findFirst({
      where: { id },
      select: { status: true, titulo: true, cidadaoId: true },
    })
    if (!atual) throw new Error('demanda não encontrada')
    if (atual.status === para && !nota) return // nada a registrar

    await prisma.$transaction([
      prisma.demanda.updateMany({ where: { id }, data: { status: para } }),
      prisma.movimentacaoDemanda.create({
        data: { demandaId: id, de: atual.status, para, nota } as never,
      }),
    ])

    // PROVA DE TRABALHO: ao resolver, registra comunicação ao cidadão vinculado e
    // esquenta o termômetro. Criada fora da transação para capturar o id e enfileirar.
    if (para === 'RESOLVIDA' && atual.status !== 'RESOLVIDA' && atual.cidadaoId) {
      const com = await prisma.comunicacaoEnviada.create({
        data: {
          cidadaoId: atual.cidadaoId,
          demandaId: id,
          tipo: 'demanda_resolvida',
          conteudo: `Sua demanda "${atual.titulo}" foi resolvida.`,
        } as never,
      })
      await prisma.cidadao.updateMany({ where: { id: atual.cidadaoId }, data: { ultimoContato: new Date() } })
      comunicacaoId = com.id
    }
  })

  // enfileira o envio. Se o Redis estiver fora, a prova fica registrada (enviadaEm null)
  // e pode ser reenviada depois — não derruba a resolução da demanda.
  if (comunicacaoId) {
    try {
      await enfileirarComunicacao({ comunicacaoId, camaraId: session.tenant.camaraId, gabineteId: session.tenant.gabineteId })
    } catch (e) {
      console.error('falha ao enfileirar comunicação (segue registrada):', e)
    }
  }

  revalidatePath('/dashboard/demandas')
  revalidatePath(`/dashboard/demandas/${id}`)
}
