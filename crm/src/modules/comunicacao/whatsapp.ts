/**
 * Adaptador WhatsApp — Zernio (https://zernio.com). Provedor oficial (BSP) sobre a Meta Cloud API:
 * onboarding do WABA por embedded signup, tier free de plataforma. Trocar de provedor (Meta direto,
 * 360dialog…) = reescrever só este arquivo; o seam `enviar.ts` não muda.
 *
 * MODOS (regra da Meta, não da Zernio):
 *   - texto livre  → só vale DENTRO de 24h da última msg do cidadão (conversa de serviço)
 *   - template     → obrigatório p/ notificação PROATIVA (fora das 24h); precisa estar aprovado na Meta
 * Quando há `template`, mandamos template (caso proativo, o nosso); senão, texto livre.
 *
 * ⚠️ ENDPOINT/CORPO: a doc pública da Zernio não expõe a rota 1:1 (site renderizado por JS).
 * Os defaults abaixo são o melhor palpite a partir da API reference visível (base /api/v1, Bearer,
 * `accountId`, `platforms:["whatsapp"]`). CONFIRMAR no painel autenticado e ajustar via env:
 *   ZERNIO_API_URL · ZERNIO_API_KEY · ZERNIO_ACCOUNT_ID · ZERNIO_SEND_PATH · ZERNIO_TEMPLATE_LANG
 */
import type { Mensagem, ResultadoEnvio } from './enviar.js'

const cfg = {
  url: process.env.ZERNIO_API_URL ?? 'https://zernio.com/api/v1',
  key: process.env.ZERNIO_API_KEY ?? '',
  accountId: process.env.ZERNIO_ACCOUNT_ID ?? '',
  sendPath: process.env.ZERNIO_SEND_PATH ?? '/messages', // TODO: confirmar rota 1:1 no painel
  templateLang: process.env.ZERNIO_TEMPLATE_LANG ?? 'pt_BR',
}

/** Normaliza p/ E.164 simples (mantém dígitos, garante DDI Brasil se faltar). */
export function e164(telefone: string): string {
  const d = telefone.replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('55')) return `+${d}`
  return `+55${d}` // assume Brasil quando vem sem DDI
}

export async function enviarWhatsApp(msg: Mensagem): Promise<ResultadoEnvio> {
  const provedor = 'zernio'
  if (!cfg.key || !cfg.accountId) {
    return { ok: false, provedor, erro: 'WhatsApp não configurado (ZERNIO_API_KEY/ZERNIO_ACCOUNT_ID)' }
  }
  const to = msg.telefone ? e164(msg.telefone) : ''
  if (!to) return { ok: false, provedor, erro: 'destinatário sem telefone válido' }

  // Monta o corpo conforme o modo. Estrutura provável da Zernio (ajustar à doc real se preciso).
  const body: Record<string, unknown> = {
    platforms: ['whatsapp'],
    accountId: cfg.accountId,
    to,
  }
  if (msg.template) {
    body.template = {
      name: msg.template.nome,
      language: msg.template.idioma ?? cfg.templateLang,
      // Zernio/Meta: variáveis posicionais {{1}},{{2}}… → componentes "body"
      components: [
        { type: 'body', parameters: (msg.template.variaveis ?? []).map((v) => ({ type: 'text', text: v })) },
      ],
    }
  } else {
    body.content = msg.conteudo // texto livre (janela de 24h)
  }

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 12000)
    const r = await fetch(`${cfg.url}${cfg.sendPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      return { ok: false, provedor, erro: `HTTP ${r.status} ${txt.slice(0, 200)}` }
    }
    const j = (await r.json().catch(() => ({}))) as { id?: string; messageId?: string }
    return { ok: true, provedor, idExterno: j.id ?? j.messageId }
  } catch (e) {
    return { ok: false, provedor, erro: e instanceof Error ? e.message : 'falha de rede' }
  }
}
