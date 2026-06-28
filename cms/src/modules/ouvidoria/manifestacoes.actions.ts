'use server'

import { getPayloadClient } from '@/lib/payload'

export interface EstadoManifestacao {
  ok: boolean
  protocolo?: string
  erro?: string
}

// Identificação exigida pela LAI (Decreto 7.724/2012, art. 12): nome + documento.
const obrigatorios = ['nome', 'documento', 'email', 'assunto', 'mensagem'] as const

// Segurança (auditoria A5 — docs/08): teto de tamanho por campo. Corta payload
// absurdo antes do banco (anti-DoS/inchaço). Não substitui rate limit no deploy.
const limites: Record<string, number> = {
  nome: 200, documento: 32, email: 200, assunto: 200, mensagem: 5000,
  categoria: 50, solicitanteTipo: 20, formaResposta: 20, telefone: 40,
}

/**
 * Recebe o formulário de e-SIC/Ouvidoria e cria a manifestação no Payload,
 * retornando o número de protocolo. Usado como server action de <form>.
 */
export async function enviarManifestacao(
  _prev: EstadoManifestacao,
  formData: FormData,
): Promise<EstadoManifestacao> {
  const tipo = String(formData.get('tipo') ?? '')
  if (tipo !== 'esic' && tipo !== 'ouvidoria') {
    return { ok: false, erro: 'Tipo de manifestação inválido.' }
  }

  const dados: Record<string, string> = { tipo }
  for (const campo of obrigatorios) {
    const v = String(formData.get(campo) ?? '').trim()
    if (!v) return { ok: false, erro: 'Preencha todos os campos obrigatórios.' }
    if (v.length > limites[campo]) return { ok: false, erro: 'Um dos campos excede o tamanho permitido.' }
    dados[campo] = v
  }
  for (const opc of ['categoria', 'solicitanteTipo', 'formaResposta', 'telefone'] as const) {
    const v = String(formData.get(opc) ?? '').trim()
    if (v) dados[opc] = v.slice(0, limites[opc])
  }

  // Consentimento LGPD obrigatório.
  if (!formData.get('consentimento')) {
    return { ok: false, erro: 'É necessário aceitar o tratamento dos dados (LGPD).' }
  }

  try {
    const payload = await getPayloadClient()
    const doc = (await payload.create({
      collection: 'manifestacoes',
      data: dados as never,
    })) as unknown as { protocolo?: string }
    return { ok: true, protocolo: doc.protocolo }
  } catch {
    return { ok: false, erro: 'Não foi possível registrar agora. Tente novamente em instantes.' }
  }
}
