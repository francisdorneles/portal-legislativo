import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { verificarCredenciais } from './modules/auth/auth-core.js'
import type { TenantContext } from './lib/tenant-context.js'

/**
 * Auth.js v5 — login e-mail+senha. A lógica real fica em auth-core (testável headless,
 * provada em scripts/poc-auth.ts). Aqui é só a cola do framework.
 *
 * Estratégia JWT: o tenant (camaraId/gabineteId) viaja no token e é exposto em
 * session.tenant, consumido por withTenant() nas server actions / páginas.
 */
declare module 'next-auth' {
  interface Session {
    tenant: TenantContext
    user: { id: string; name?: string | null; email?: string | null }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, senha: {} },
      authorize: async (creds) => {
        const u = await verificarCredenciais(String(creds?.email ?? ''), String(creds?.senha ?? ''))
        if (!u) return null
        return { id: u.usuarioId, email: u.email, name: u.nome, camaraId: u.camaraId, gabineteId: u.gabineteId }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id: string }).id
        token.camaraId = (user as { camaraId: string }).camaraId
        token.gabineteId = (user as { gabineteId: string }).gabineteId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.uid as string
      session.tenant = { camaraId: token.camaraId as string, gabineteId: token.gabineteId as string }
      return session
    },
  },
})
