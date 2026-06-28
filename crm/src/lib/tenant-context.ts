import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Contexto de tenant da requisição. Carregado a partir da sessão (Auth.js) no início
 * de cada request/job e lido automaticamente pela Prisma Extension de isolamento.
 *
 * Em produção: um middleware/wrapper preenche isto com base na sessão autenticada.
 * Nunca confiar em camaraId/gabineteId vindos do corpo da requisição.
 */
export interface TenantContext {
  camaraId: string
  gabineteId: string
}

// Ancorado em globalThis: o bundler do Next pode instanciar este módulo mais de uma vez
// (imports via alias '@/...' e relativo './...'). Sem isto, with-tenant gravaria o contexto
// numa instância do ALS e o prisma leria de outra → isolamento silenciosamente quebrado.
const _g = globalThis as unknown as { __crmTenantStore?: AsyncLocalStorage<TenantContext> }
export const tenantStore: AsyncLocalStorage<TenantContext> =
  _g.__crmTenantStore ?? (_g.__crmTenantStore = new AsyncLocalStorage<TenantContext>())

/** Roda `fn` com o contexto de tenant ativo. */
export function runComTenant<T>(ctx: TenantContext, fn: () => T): T {
  return tenantStore.run(ctx, fn)
}

export function getTenant(): TenantContext | undefined {
  return tenantStore.getStore()
}

/** Igual a getTenant, mas lança se não houver contexto — use em código que NUNCA pode rodar sem tenant. */
export function requireTenant(): TenantContext {
  const ctx = tenantStore.getStore()
  if (!ctx) throw new Error('Sem contexto de tenant: operação isolada exige camaraId/gabineteId.')
  return ctx
}

/**
 * Envolve o processamento de um job BullMQ com o contexto de tenant.
 * O job DEVE carregar camaraId/gabineteId no seu payload (gravados ao enfileirar).
 * Sem isto, jobs rodam fora de contexto e a extensão de isolamento não se aplica.
 *
 *   new Worker('demandas', (job) => comTenantDoJob(job.data, () => processar(job)))
 */
export function comTenantDoJob<T>(
  payload: { camaraId: string; gabineteId: string },
  fn: () => Promise<T>,
): Promise<T> {
  // await dentro do run — ver nota em with-tenant.ts (promises lazy do Prisma).
  return tenantStore.run({ camaraId: payload.camaraId, gabineteId: payload.gabineteId }, async () => await fn())
}
