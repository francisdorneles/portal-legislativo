import { prisma } from '../../lib/prisma.js'

/**
 * Aniversariantes do dia: varre TODOS os gabinetes (admin) e gera um Alerta de aniversário
 * para quem faz aniversário hoje. Dedup por ano (1 alerta por cidadão por ano).
 * Compara mês/dia em UTC (nascimento vem como YYYY-MM-DD → meia-noite UTC).
 */
export async function scanAniversariantes(hoje: Date = new Date()): Promise<number> {
  const mes = hoje.getUTCMonth()
  const dia = hoje.getUTCDate()
  const inicioAno = new Date(Date.UTC(hoje.getUTCFullYear(), 0, 1))

  const comNasc = await prisma.cidadao.findMany({
    where: { nascimento: { not: null } },
    select: { id: true, nome: true, nascimento: true, camaraId: true, gabineteId: true },
  })

  let criados = 0
  for (const c of comNasc) {
    const n = c.nascimento!
    if (n.getUTCMonth() !== mes || n.getUTCDate() !== dia) continue

    const jaTem = await prisma.alerta.findFirst({
      where: { cidadaoId: c.id, tipo: 'aniversario', createdAt: { gte: inicioAno } },
    })
    if (jaTem) continue

    await prisma.alerta.create({
      data: {
        camaraId: c.camaraId,
        gabineteId: c.gabineteId,
        cidadaoId: c.id,
        tipo: 'aniversario',
        mensagem: `Hoje é aniversário de ${c.nome}.`,
      },
    })
    criados++
  }
  return criados
}
