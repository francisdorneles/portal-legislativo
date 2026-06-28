/**
 * Indexação semântica (RAG) — gera embeddings dos dados do gabinete e grava em `Embedding`.
 *
 * ISOLAMENTO: a inserção é RAW SQL (o campo `vetor` é Unsupported no Prisma), então a
 * extensão NÃO se aplica — preenchemos camaraId/gabineteId À MÃO a partir do contexto de
 * tenant (requireTenant). Dados do gabinete vão com gabineteId preenchido (privados).
 * Documentos compartilhados da câmara (TSE/norma) entrariam com gabineteId NULL.
 *
 * Roda DENTRO de runComTenant/withTenant.
 */
import { randomUUID } from 'node:crypto'
import { prisma } from '../../lib/prisma.js'
import { requireTenant } from '../../lib/tenant-context.js'
import { embed, vetorLiteral } from './gateway.js'

export type ResumoIndexacao = { origem: string; indexados: number }

/** Texto canônico de uma demanda para embedding. */
function textoDemanda(d: { titulo: string; descricao: string | null; tema: string | null; bairro: string | null }): string {
  return [
    d.titulo,
    d.descricao ?? '',
    d.tema ? `Tema: ${d.tema}` : '',
    d.bairro ? `Bairro: ${d.bairro}` : '',
  ]
    .filter(Boolean)
    .join('. ')
}

/**
 * (Re)indexa as demandas do gabinete da sessão. Idempotente: apaga os embeddings de
 * origem='demanda' do gabinete antes de reinserir.
 */
export async function indexarDemandasDoGabinete(): Promise<ResumoIndexacao> {
  const { camaraId, gabineteId } = requireTenant()

  // lê demandas (a extensão isola por gabinete automaticamente nesta leitura tipada)
  const demandas = await prisma.demanda.findMany({
    select: { id: true, titulo: true, descricao: true, tema: true, bairro: true },
  })
  if (demandas.length === 0) {
    await limparEmbeddings('demanda', camaraId, gabineteId)
    return { origem: 'demanda', indexados: 0 }
  }

  const vetores = await embed(demandas.map(textoDemanda))

  await limparEmbeddings('demanda', camaraId, gabineteId)
  for (let i = 0; i < demandas.length; i++) {
    const d = demandas[i]
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Embedding" (id, "camaraId", "gabineteId", origem, "referenciaId", texto, vetor)
       VALUES ($1, $2, $3, 'demanda', $4, $5, $6::vector)`,
      randomUUID(),
      camaraId,
      gabineteId,
      d.id,
      textoDemanda(d),
      vetorLiteral(vetores[i]),
    )
  }
  return { origem: 'demanda', indexados: demandas.length }
}

/** Remove embeddings de uma origem para o gabinete (raw — filtra à mão). */
async function limparEmbeddings(origem: string, camaraId: string, gabineteId: string) {
  await prisma.$executeRawUnsafe(
    `DELETE FROM "Embedding" WHERE origem = $1 AND "camaraId" = $2 AND "gabineteId" = $3`,
    origem,
    camaraId,
    gabineteId,
  )
}
