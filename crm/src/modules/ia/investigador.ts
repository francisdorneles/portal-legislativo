'use server'

/**
 * Agente Investigador — IA agêntica que responde perguntas estratégicas do gabinete cruzando as
 * fontes que JÁ vivem no CRM (eleitoral + demandas + prestação). Usa function-calling: o modelo
 * decide QUAIS ferramentas chamar e quantas vezes, depois redige um dossiê citando os números.
 *
 * ISOLAMENTO: cada ferramenta é uma query session-aware que faz seu PRÓPRIO `withTenant` —
 * o gabinete vem da sessão, NUNCA de argumento do modelo. O modelo só passa dados inócuos
 * (ex.: nome de bairro), usados em filtros dentro do escopo já isolado. Não grava nada.
 *
 * Requer IA de fronteira com tool-calling (OpenAI-compatible: OpenAI/Groq/Ollama qwen2.5).
 */
import { auth } from '@/auth'
import { iaConfig } from './config'
import { montarSinais } from './copiloto'
import { mapaDisputaParaPagina } from '@/modules/radar/radar.ui'
import { prestacaoDoBairro, listarBairrosComDemandas } from '@/modules/crm/prestacao.queries'

type Ferramenta = {
  def: { type: 'function'; function: { name: string; description: string; parameters: object } }
  run: (args: Record<string, unknown>) => Promise<unknown>
}

const semParams = { type: 'object', properties: {}, additionalProperties: false }

const FERRAMENTAS: Record<string, Ferramenta> = {
  panorama_bairros: {
    def: {
      type: 'function',
      function: {
        name: 'panorama_bairros',
        description:
          'Panorama por bairro: situação eleitoral (meu/disputa/rival), meus votos vs. do líder, ' +
          'demandas abertas e contatos esfriando/frios. Use para ter a visão geral do território.',
        parameters: semParams,
      },
    },
    run: async () => montarSinais(),
  },
  mapa_disputa: {
    def: {
      type: 'function',
      function: {
        name: 'mapa_disputa',
        description:
          'Mapa de disputa eleitoral do meu candidato: classificação de cada bairro (meu território, ' +
          'em disputa, do rival) + resumo dos totais. Use para saber onde ganho/perco a eleição.',
        parameters: semParams,
      },
    },
    run: async () => mapaDisputaParaPagina(),
  },
  prestacao_bairro: {
    def: {
      type: 'function',
      function: {
        name: 'prestacao_bairro',
        description:
          'Prova de trabalho num bairro: demandas resolvidas/em andamento, temas e comunicações ' +
          'enviadas. Use para saber o que o gabinete já entregou ali.',
        parameters: {
          type: 'object',
          properties: { bairro: { type: 'string', description: 'nome do bairro (exato)' } },
          required: ['bairro'],
          additionalProperties: false,
        },
      },
    },
    run: async (a) => prestacaoDoBairro(String(a.bairro ?? '')),
  },
  bairros_com_demandas: {
    def: {
      type: 'function',
      function: {
        name: 'bairros_com_demandas',
        description: 'Lista os bairros que têm demandas no gabinete (nomes válidos + contagens). ' +
          'Use para descobrir nomes de bairro antes de pedir prestacao_bairro.',
        parameters: semParams,
      },
    },
    run: async () => listarBairrosComDemandas(),
  },
}

const SISTEMA = `Você é um analista político investigativo do gabinete de um vereador. Responda à
pergunta do chefe de gabinete consultando as FERRAMENTAS de dados (eleitorais e do CRM, já
isoladas para este gabinete). Regras:
- Baseie TUDO nos números reais retornados pelas ferramentas; cite-os. NÃO invente dados.
- Chame quantas ferramentas precisar (ex.: cruze mapa de disputa com prestação de um bairro).
- Se um dado não existir, diga claramente em vez de supor.
- Entregue um DOSSIÊ objetivo em markdown: **Panorama**, **Achados** (com números) e
  **Recomendação** (ação concreta). Linguagem direta, sem floreio.`

export type Investigacao = { resposta: string; passos: string[] }

type MsgTool = { id: string; function: { name: string; arguments: string } }
type Choice = { message: { content: string | null; tool_calls?: MsgTool[]; role: string } }

export async function investigar(pergunta: string): Promise<Investigacao> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  const p = pergunta.trim()
  if (!p) throw new Error('pergunta vazia')

  const { url, key, model } = iaConfig.fronteira
  if (!key) throw new Error('Investigador requer IA de fronteira (IA_FRONTIER_KEY) com tool-calling')

  const tools = Object.values(FERRAMENTAS).map((f) => f.def)
  const messages: Record<string, unknown>[] = [
    { role: 'system', content: SISTEMA },
    { role: 'user', content: p },
  ]
  const passos: string[] = []

  async function chamar(comTools: boolean): Promise<Choice> {
    const r = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages,
        ...(comTools ? { tools, tool_choice: 'auto' } : {}),
      }),
    })
    if (!r.ok) throw new Error(`investigador ${r.status}`)
    const j = (await r.json()) as { choices: Choice[] }
    return j.choices[0]
  }

  // Loop agêntico: o modelo chama ferramentas até decidir responder (teto de passos como segurança).
  const MAX = 6
  for (let i = 0; i < MAX; i++) {
    const escolha = await chamar(true)
    const msg = escolha.message
    messages.push(msg as unknown as Record<string, unknown>)

    if (!msg.tool_calls?.length) return { resposta: msg.content ?? '', passos }

    for (const tc of msg.tool_calls) {
      const ferramenta = FERRAMENTAS[tc.function.name]
      let args: Record<string, unknown> = {}
      try {
        args = tc.function.arguments ? (JSON.parse(tc.function.arguments) as Record<string, unknown>) : {}
      } catch {
        /* argumentos malformados → segue com {} */
      }
      const rotulo = tc.function.name + (args.bairro ? ` (${String(args.bairro)})` : '')
      let resultado: unknown
      try {
        resultado = ferramenta ? await ferramenta.run(args) : { erro: 'ferramenta desconhecida' }
        passos.push(`consultou ${rotulo}`)
      } catch (e) {
        resultado = { erro: e instanceof Error ? e.message : 'falha' }
        passos.push(`falhou ${rotulo}`)
      }
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(resultado).slice(0, 8000), // teto p/ não estourar contexto
      })
    }
  }

  // Esgotou os passos: força uma resposta final com o que já coletou (sem mais ferramentas).
  const final = await chamar(false)
  return { resposta: final.message.content ?? 'Não consegui concluir a investigação.', passos }
}
