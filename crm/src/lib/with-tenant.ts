import { tenantStore, type TenantContext } from './tenant-context.js'

/**
 * Ponte sessão → contexto de tenant. Em produção, server actions e route handlers
 * resolvem a sessão do Auth.js e envolvem TODA a lógica de dados com isto, garantindo
 * que a extensão de isolamento (src/lib/prisma.ts) tenha camaraId/gabineteId vivos
 * durante o `await` da query (lição do PoC: o await precisa estar dentro do contexto).
 *
 *   export async function listarCidadaos() {
 *     const session = await auth()
 *     if (!session) throw new Error('não autenticado')
 *     return withTenant(session.tenant, () => prisma.cidadao.findMany())
 *   }
 */
export function withTenant<T>(tenant: TenantContext, fn: () => Promise<T>): Promise<T> {
  // O `await fn()` fica DENTRO do run: as promises do Prisma são lazy e só executam o
  // isolamento no await — precisa estar dentro do contexto (lição do PoC). Assim o
  // chamador pode passar `() => prisma...` sem await que o wrapper garante a correção.
  return tenantStore.run(tenant, async () => await fn())
}
