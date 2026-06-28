/**
 * Busca semântica (RAG retrieval) com ISOLAMENTO MANUAL.
 *
 * pgvector via raw SQL — NÃO passa pela extensão de tenant, então o filtro de isolamento é
 * explícito e é a parte mais sensível do sistema:
 *   camaraId = <câmara> AND (gabineteId = <gabinete> OR gabineteId IS NULL)
 * Ou seja: o gabinete vê SÓ os próprios documentos privados + os compartilhados da câmara.
 * Nunca os de outro gabinete. (PoC: scripts/poc-ia-isolamento.ts)
 *
 * Roda dentro de runComTenant/withTenant (lê o contexto p/ montar o filtro).
 */
import { prisma } from '../../lib/prisma.js'
import { requireTenant } from '../../lib/tenant-context.js'
import { embed, vetorLiteral } from './gateway.js'

export type Trecho = {
  id: string
  origem: string
  referenciaId: string
  texto: string
  distancia: number
}

/** Recupera os k trechos mais próximos da consulta, isolados pelo tenant da sessão. */
export async function buscarSemelhantes(consulta: string, k = 5): Promise<Trecho[]> {
  const { camaraId, gabineteId } = requireTenant()
  const [vetor] = await embed([consulta])

  const rows = await prisma.$queryRawUnsafe<Trecho[]>(
    `SELECT id, origem, "referenciaId", texto, (vetor <=> $1::vector) AS distancia
       FROM "Embedding"
      WHERE "camaraId" = $2
        AND ("gabineteId" = $3 OR "gabineteId" IS NULL)
        AND vetor IS NOT NULL
      ORDER BY vetor <=> $1::vector
      LIMIT $4`,
    vetorLiteral(vetor),
    camaraId,
    gabineteId,
    k,
  )
  return rows
}
