'use server'

/**
 * Chat com FONTE RASTREÁVEL (RAG). Recupera trechos isolados do gabinete da sessão e gera a
 * resposta CITANDO as fontes. Roda no tier 'local' (Ollama) — os dados do cidadão não saem
 * da infra (privacidade/LGPD). Nunca responde fora do contexto recuperado.
 */
import { auth } from '@/auth'
import { withTenant } from '@/lib/with-tenant'
import { buscarSemelhantes, type Trecho } from './busca'
import { gerar } from './gateway'

export type Fonte = { n: number; origem: string; referenciaId: string; texto: string }
export type RespostaIA = { resposta: string; fontes: Fonte[] }

const SISTEMA = `Você é o assistente de inteligência de um gabinete de vereador.
Responda SEMPRE em português, de forma objetiva e direta.
Use APENAS as informações dos TRECHOS fornecidos. Não invente dados.
Cite as fontes usadas no formato [1], [2] ao longo da resposta.
Se a resposta não estiver nos trechos, diga claramente: "Não encontrei isso na base do gabinete."`

export async function perguntarIA(pergunta: string): Promise<RespostaIA> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  const texto = pergunta.trim()
  if (!texto) return { resposta: 'Faça uma pergunta sobre a base do gabinete.', fontes: [] }

  return withTenant(session.tenant, async () => {
    const trechos: Trecho[] = await buscarSemelhantes(texto, 6)
    const fontes: Fonte[] = trechos.map((t, i) => ({
      n: i + 1,
      origem: t.origem,
      referenciaId: t.referenciaId,
      texto: t.texto,
    }))

    if (fontes.length === 0) {
      return { resposta: 'Não encontrei nada relacionado na base do gabinete. Cadastre/indexe demandas primeiro.', fontes: [] }
    }

    const contexto = fontes.map((f) => `[${f.n}] (${f.origem}) ${f.texto}`).join('\n')
    const prompt = `Pergunta: ${texto}\n\nTRECHOS DA BASE DO GABINETE:\n${contexto}\n\nResponda usando apenas os trechos acima e cite as fontes.`

    const resposta = await gerar({ tier: 'local', sistema: SISTEMA, prompt, temperatura: 0.2 })
    return { resposta, fontes }
  })
}
