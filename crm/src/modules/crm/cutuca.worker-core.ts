import { prisma } from '../../lib/prisma.js'
import { LIMIAR_FRIO } from './relacionamento.js'

/**
 * Cutuca de relacionamento: varre TODOS os gabinetes (contexto admin — sem tenant) e gera
 * um Alerta para cada contato que esfriou (já teve contato, mas passou de LIMIAR_FRIO dias).
 * Não duplica: pula quem já tem alerta pendente (lidoEm null) do mesmo tipo.
 *
 * Roda sem withTenant de propósito — é um job global. Por isso seta camaraId/gabineteId
 * explicitamente (a extensão não injeta sem contexto).
 */
export async function scanCutucaRelacionamento(agora: Date = new Date()): Promise<number> {
  const limite = new Date(agora.getTime() - LIMIAR_FRIO * 86_400_000)

  const frios = await prisma.cidadao.findMany({
    where: { ultimoContato: { not: null, lt: limite } },
    select: { id: true, nome: true, camaraId: true, gabineteId: true },
  })

  let criados = 0
  for (const c of frios) {
    const pendente = await prisma.alerta.findFirst({
      where: { cidadaoId: c.id, tipo: 'relacionamento_frio', lidoEm: null },
    })
    if (pendente) continue
    await prisma.alerta.create({
      data: {
        camaraId: c.camaraId,
        gabineteId: c.gabineteId,
        cidadaoId: c.id,
        tipo: 'relacionamento_frio',
        mensagem: `Sem contato com ${c.nome} há mais de ${LIMIAR_FRIO} dias.`,
      },
    })
    criados++
  }
  return criados
}
