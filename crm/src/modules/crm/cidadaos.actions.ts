'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import type { TenantContext } from '@/lib/tenant-context'

async function tenantDaSessao(): Promise<TenantContext> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return session.tenant
}

function campos(formData: FormData) {
  const nome = String(formData.get('nome') ?? '').trim()
  if (!nome) throw new Error('nome obrigatório')
  const ehLideranca = String(formData.get('tipoContato') ?? '') === 'LIDERANCA'
  const tags = String(formData.get('tags') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const influenciaRaw = parseInt(String(formData.get('influencia') ?? ''), 10)
  const nascRaw = String(formData.get('nascimento') ?? '').trim()

  return {
    nome,
    telefone: String(formData.get('telefone') ?? '').trim() || null,
    email: String(formData.get('email') ?? '').trim() || null,
    bairro: String(formData.get('bairro') ?? '').trim() || null,
    nascimento: nascRaw ? new Date(nascRaw) : null,
    tags,
    tipoContato: ehLideranca ? ('LIDERANCA' as const) : ('CIDADAO' as const),
    tipoLideranca: ehLideranca ? String(formData.get('tipoLideranca') ?? '').trim() || null : null,
    influencia: ehLideranca && !Number.isNaN(influenciaRaw) ? influenciaRaw : null,
    regiaoInfluencia: ehLideranca ? String(formData.get('regiaoInfluencia') ?? '').trim() || null : null,
  }
}

/**
 * Cria um cidadão no gabinete da sessão. O gabineteId/camaraId NÃO vêm do formulário —
 * são injetados pela extensão de isolamento a partir do contexto (withTenant). Nunca
 * confiar em tenant vindo do cliente.
 */
export async function criarCidadao(formData: FormData) {
  const tenant = await tenantDaSessao()
  const data = campos(formData)
  await withTenant(tenant, () => prisma.cidadao.create({ data: data as never }))
  revalidatePath('/dashboard/cidadaos')
  redirect('/dashboard/cidadaos')
}

/**
 * Edita um cidadão. O `where` recebe só o id; a extensão de isolamento injeta o
 * gabineteId — então editar id de outro gabinete não altera nada (updateMany count 0).
 */
export async function editarCidadao(id: string, formData: FormData) {
  const tenant = await tenantDaSessao()
  const data = campos(formData)
  await withTenant(tenant, () => prisma.cidadao.updateMany({ where: { id }, data }))
  revalidatePath('/dashboard/cidadaos')
  redirect('/dashboard/cidadaos')
}

export async function excluirCidadao(id: string) {
  const tenant = await tenantDaSessao()
  await withTenant(tenant, () => prisma.cidadao.deleteMany({ where: { id } }))
  revalidatePath('/dashboard/cidadaos')
  redirect('/dashboard/cidadaos')
}

/** Marca contato com o cidadão agora (esquenta o termômetro). */
export async function registrarContato(id: string) {
  const tenant = await tenantDaSessao()
  await withTenant(tenant, () =>
    prisma.cidadao.updateMany({ where: { id }, data: { ultimoContato: new Date() } }),
  )
  revalidatePath('/dashboard/cidadaos')
  revalidatePath('/dashboard')
}
