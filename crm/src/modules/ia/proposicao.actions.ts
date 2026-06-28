'use server'

/**
 * Demanda → PROPOSIÇÃO. A IA redige uma minuta de Indicação/Requerimento a partir da
 * demanda, em português legislativo. Tarefa "difícil" → tier 'fronteira' (melhor redação).
 * Isolada: lê a demanda no contexto do gabinete da sessão.
 */
import { auth } from '@/auth'
import { withTenant } from '@/lib/with-tenant'
import { buscarDemanda } from '@/modules/crm/demandas.queries'
import { gerar } from './gateway'

const SISTEMA = `Você é assessor legislativo de um vereador. Redija uma minuta de INDICAÇÃO
(ou REQUERIMENTO, se mais adequado) dirigida ao Poder Executivo municipal, em português formal
e técnico-legislativo. Estrutura: título (ex.: "INDICAÇÃO Nº ___/AAAA"), preâmbulo ("O Vereador
que esta subscreve, no uso de suas atribuições..."), o pedido ("INDICA ao Senhor Prefeito..."),
e uma breve justificativa. Seja objetivo, sem inventar fatos além dos fornecidos. Não preencha
número nem data — deixe lacunas.`

export type Proposicao = { texto: string }

export async function gerarProposicao(demandaId: string): Promise<Proposicao> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')

  return withTenant(session.tenant, async () => {
    const d = await buscarDemanda(demandaId)
    if (!d) throw new Error('demanda não encontrada')

    const prompt = `Gere a minuta a partir desta demanda do gabinete:
- Título: ${d.titulo}
- Tema: ${d.tema ?? 'não informado'}
- Bairro/local: ${d.bairro ?? 'não informado'}
- Descrição: ${d.descricao ?? 'não informada'}
- Cidadão solicitante: ${d.cidadao?.nome ?? 'não informado'}`

    const texto = await gerar({ tier: 'fronteira', sistema: SISTEMA, prompt, temperatura: 0.3, maxTokens: 700 })
    return { texto }
  })
}
