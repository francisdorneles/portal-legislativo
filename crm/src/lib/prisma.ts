import { PrismaClient } from '@prisma/client'
import { getTenant } from './tenant-context.js'

/**
 * Prisma Extension de ISOLAMENTO AUTOMÁTICO por gabinete.
 *
 * Regra (risco #3 das premissas do CRM): nenhuma query de modelo do CRM pode
 * tocar dado de outro gabinete. Em vez de lembrar de filtrar `gabineteId` em cada
 * query (frágil), a extensão injeta o filtro/atribuição a partir do TenantContext.
 *
 * - Modelos de TENANCY (Camara/Gabinete/Usuario) NÃO são isolados — são a própria
 *   estrutura. Operações de seed/admin rodam SEM contexto de tenant.
 * - Cada modelo isolado tem um ESCOPO:
 *     'gabinete' → CRM (Cidadao, Demanda): injeta gabineteId (+ camaraId no create)
 *     'camara'   → geo/IA (UnidadeTerritorial, ResultadoEleitoral, Embedding): injeta camaraId
 * - Por operação:
 *     leitura  → injeta `where.<escopo>`
 *     create   → injeta os ids no `data`
 *     update/delete/upsert → injeta `where.<escopo>` (Prisma aceita filtro extra
 *       não-único junto do filtro único → bloqueia escrita cruzada por id adivinhado)
 *
 * ⚠️ RAW QUERIES ($queryRaw/$executeRaw) NÃO passam por esta extensão. Toda raw query
 *    DEVE filtrar manualmente por camaraId/gabineteId (ver helper `tenantWhereRaw`).
 */
type Escopo = 'gabinete' | 'camara'
const MODELOS_ISOLADOS: Record<string, Escopo> = {
  Cidadao: 'gabinete',
  Demanda: 'gabinete',
  MovimentacaoDemanda: 'gabinete',
  ComunicacaoEnviada: 'gabinete',
  Alerta: 'gabinete',
  DocumentoGabinete: 'gabinete',
  UnidadeTerritorial: 'camara',
  ResultadoEleitoral: 'camara',
  Embedding: 'camara',
  ConteudoIA: 'gabinete',
}

const LEITURA = new Set([
  'findFirst', 'findFirstOrThrow', 'findMany', 'findUnique', 'findUniqueOrThrow',
  'count', 'aggregate', 'groupBy',
])
const WHERE_ESCRITA = new Set(['update', 'updateMany', 'delete', 'deleteMany', 'upsert'])

function makeClient() {
  return new PrismaClient().$extends({
    name: 'isolamento-tenant',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const ctx = getTenant()
          const escopo = MODELOS_ISOLADOS[model]
          if (!ctx || !escopo) return query(args)

          // filtro de leitura/where-escrita conforme o escopo do modelo
          const filtro =
            escopo === 'gabinete' ? { gabineteId: ctx.gabineteId } : { camaraId: ctx.camaraId }
          // no create, gabinete-escopo também grava camaraId (consistência do tenant)
          const atribuir =
            escopo === 'gabinete'
              ? { gabineteId: ctx.gabineteId, camaraId: ctx.camaraId }
              : { camaraId: ctx.camaraId }

          const a = (args ?? {}) as Record<string, unknown>

          if (LEITURA.has(operation) || WHERE_ESCRITA.has(operation)) {
            a.where = { ...(a.where as object), ...filtro }
          }
          if (operation === 'create') {
            a.data = { ...(a.data as object), ...atribuir }
          }
          if (operation === 'createMany') {
            const data = (a.data as Array<Record<string, unknown>>) ?? []
            a.data = data.map((d) => ({ ...d, ...atribuir }))
          }
          if (operation === 'upsert') {
            a.create = { ...(a.create as object), ...atribuir }
          }
          return query(a)
        },
      },
    },
  })
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof makeClient> }
export const prisma = globalForPrisma.prisma ?? makeClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
