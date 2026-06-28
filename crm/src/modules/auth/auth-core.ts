import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import type { TenantContext } from '../../lib/tenant-context.js'

/**
 * Núcleo de autenticação — SEM dependência de framework, para ser testável headless.
 * O Auth.js (auth.ts) apenas chama estas funções no `authorize` e nos callbacks.
 *
 * Usa um PrismaClient ADMIN (sem extensão de isolamento), porque login acontece ANTES
 * de existir contexto de tenant — precisamos achar o usuário sem filtro de gabinete.
 */
const adminPrisma = new PrismaClient()

export interface SessaoUsuario extends TenantContext {
  usuarioId: string
  email: string
  nome: string
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10)
}

/**
 * Valida e-mail+senha. Retorna os dados de sessão (incl. tenant) ou null se inválido/inativo.
 * Mensagem de erro genérica de propósito (não revelar se o e-mail existe).
 */
export async function verificarCredenciais(
  email: string,
  senha: string,
): Promise<SessaoUsuario | null> {
  if (!email || !senha) return null
  const u = await adminPrisma.usuario.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!u || !u.ativo) return null
  const ok = await bcrypt.compare(senha, u.senhaHash)
  if (!ok) return null
  return {
    usuarioId: u.id,
    email: u.email,
    nome: u.nome,
    camaraId: u.camaraId,
    gabineteId: u.gabineteId,
  }
}
