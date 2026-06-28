/**
 * Seam de ENVIO de comunicação — provider-agnóstico. O worker chama `enviar()` e não sabe (nem
 * deve saber) qual provedor entrega: WhatsApp (Zernio), e-mail, SMS... Trocar de provedor =
 * trocar o adaptador + env, sem tocar no resto do sistema. Mesma filosofia da camada de IA.
 *
 * Sem PII vazando pra log: o adaptador recebe só o necessário pra entregar.
 */
export type CanalEnvio = 'REGISTRO' | 'EMAIL' | 'SMS' | 'WHATSAPP'

/** Mensagem a entregar. `template` é exigido pra WhatsApp proativo (fora da janela de 24h). */
export type Mensagem = {
  canal: CanalEnvio
  nome: string // nome do destinatário (p/ variáveis de template e logs amigáveis)
  telefone?: string | null
  email?: string | null
  conteudo: string // texto livre (usado dentro de 24h ou em canais sem janela)
  template?: {
    nome: string // nome do template aprovado na Meta
    idioma?: string // ex.: 'pt_BR'
    variaveis?: string[] // valores que preenchem {{1}}, {{2}}… na ordem
  }
}

export type ResultadoEnvio =
  | { ok: true; provedor: string; idExterno?: string }
  | { ok: false; provedor: string; erro: string }

/**
 * Entrega a mensagem pelo provedor configurado para o canal. Resiliente: nunca lança —
 * devolve `ok:false` pra o worker decidir (reprocessar/registrar). REGISTRO = no-op (só registra).
 */
export async function enviar(msg: Mensagem): Promise<ResultadoEnvio> {
  switch (msg.canal) {
    case 'WHATSAPP': {
      const { enviarWhatsApp } = await import('./whatsapp.js')
      return enviarWhatsApp(msg)
    }
    case 'REGISTRO':
    case 'EMAIL':
    case 'SMS':
    default:
      // Canais ainda não plugados → no-op (comportamento atual: registrar já conta como "entregue").
      return { ok: true, provedor: 'registro' }
  }
}
