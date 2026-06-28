import { prisma } from '../../lib/prisma.js'
import { comTenantDoJob } from '../../lib/tenant-context.js'
import type { ComunicacaoJob } from '../../lib/queue.js'
import { enviar, type CanalEnvio } from '../comunicacao/enviar.js'

/**
 * Lógica de "entrega" de uma comunicação — testável headless (sem BullMQ).
 * Roda DENTRO do contexto de tenant (comTenantDoJob), então o isolamento se aplica:
 * o worker só toca dados do gabinete dono do job.
 *
 * Entrega real via seam `comunicacao/enviar` (WhatsApp/Zernio plugável). Canal REGISTRO/EMAIL/SMS
 * ainda é no-op (registrar já conta como entregue) — só WHATSAPP entrega de verdade quando
 * configurado. Só marca `enviadaEm` se o envio deu certo; falha real lança p/ a fila reprocessar.
 */
export async function processarComunicacao(data: ComunicacaoJob): Promise<'enviada' | 'ignorada'> {
  return comTenantDoJob(data, async () => {
    const c = await prisma.comunicacaoEnviada.findFirst({
      where: { id: data.comunicacaoId },
      include: { cidadao: { select: { nome: true, telefone: true, email: true } } },
    })
    if (!c) return 'ignorada' // não é deste gabinete ou não existe
    if (c.enviadaEm) return 'ignorada' // já entregue (idempotente)

    const r = await enviar({
      canal: c.canal as CanalEnvio,
      nome: c.cidadao?.nome ?? '',
      telefone: c.cidadao?.telefone,
      email: c.cidadao?.email,
      conteudo: c.conteudo,
      // Notificação proativa (fora da janela de 24h) → template aprovado, se configurado p/ o tipo.
      template: templateDoTipo(c.tipo, c.cidadao?.nome ?? ''),
    })
    if (!r.ok) throw new Error(`envio falhou (${r.provedor}): ${r.erro}`) // BullMQ reprocessa

    await prisma.comunicacaoEnviada.updateMany({
      where: { id: data.comunicacaoId },
      data: { enviadaEm: new Date() },
    })
    return 'enviada'
  })
}

/**
 * Mapeia o `tipo` da comunicação a um template aprovado na Meta (por env), pra notificação
 * proativa via WhatsApp. Sem template configurado → undefined (cai no texto livre / no-op).
 * Ex.: ZERNIO_TEMPLATE_DEMANDA_RESOLVIDA=demanda_resolvida
 */
function templateDoTipo(tipo: string, nome: string): { nome: string; variaveis: string[] } | undefined {
  const env = process.env[`ZERNIO_TEMPLATE_${tipo.toUpperCase()}`]
  if (!env) return undefined
  return { nome: env, variaveis: [nome] } // {{1}} = nome do cidadão (ajustar conforme o template)
}
