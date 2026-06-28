/**
 * Importação de resultados eleitorais do TSE (escopo CÂMARA).
 *
 * Fluxo: lê o CSV em latin1 → parseia (tse-parse) → grava em ResultadoEleitoral via
 * createMany. A Prisma Extension injeta `camaraId` no createMany a partir do contexto
 * de tenant — por isso este import DEVE rodar dentro de `runComTenant`/`withTenant`.
 *
 * Idempotência: como o TSE não dá id estável por linha, o import apaga os resultados
 * da câmara para o mesmo (ano, cargo) antes de inserir, evitando duplicação ao reimportar.
 */
import { readFileSync } from 'node:fs'
import { prisma } from '../../lib/prisma.js'
import { parseCsvTse, type LinhaResultadoTse } from './tse-parse.js'

/**
 * Lê o arquivo do TSE e devolve as linhas tipadas — sem tocar no banco.
 *
 * Este CSV específico vem com mojibake de UTF-8 duplo-encodado ("CLÁUDIO" → "CLÃÂUDIO"):
 * os bytes UTF-8 originais foram re-encodados como se fossem latin1. Revertemos uma camada
 * com `Buffer.from(utf8, 'latin1').toString('utf8')` antes de parsear.
 */
export function lerCsvTse(caminho: string): LinhaResultadoTse[] {
  const utf8 = readFileSync(caminho, { encoding: 'utf8' })
  const corrigido = Buffer.from(utf8, 'latin1').toString('utf8')
  return parseCsvTse(corrigido)
}

export type ResumoImport = { ano: number; cargo: string; removidos: number; inseridos: number }

/**
 * Importa linhas já parseadas para a câmara do contexto atual.
 * Reimport seguro: limpa o (ano, cargo) da câmara antes de inserir.
 * Deve ser chamada DENTRO de um contexto de tenant (runComTenant/withTenant).
 */
export async function importarResultadosTse(
  linhas: LinhaResultadoTse[],
): Promise<ResumoImport[]> {
  // agrupa por (ano|cargo) para limpar apenas o que vai ser reinserido
  const grupos = new Map<string, LinhaResultadoTse[]>()
  for (const l of linhas) {
    const k = `${l.ano}|${l.cargo}`
    const arr = grupos.get(k)
    if (arr) arr.push(l)
    else grupos.set(k, [l])
  }

  const resumos: ResumoImport[] = []
  for (const [k, arr] of grupos) {
    const [anoStr, cargo] = k.split('|')
    const ano = Number(anoStr)
    const del = await prisma.resultadoEleitoral.deleteMany({ where: { ano, cargo } })
    // camaraId é injetado em runtime pela Prisma Extension (escopo 'camara') → cast.
    await prisma.resultadoEleitoral.createMany({
      data: arr.map((l) => ({
        ano: l.ano,
        cargo: l.cargo,
        candidatoNome: l.candidatoNome,
        partido: l.partido,
        votos: l.votos,
        zona: l.zona,
        secao: l.secao,
        localVotacao: l.localVotacao,
      })) as any,
    })
    resumos.push({ ano, cargo, removidos: del.count, inseridos: arr.length })
  }
  return resumos
}
