/**
 * Documentos do SAPL servidos via proxy próprio (/api/sapl/documento).
 *
 * Regra do projeto: o público NUNCA acessa o SAPL direto. Os PDFs (pautas,
 * atas, textos) vivem no SAPL; esta camada converte a URL do SAPL na URL do
 * nosso proxy, que busca no servidor e cacheia. Ver `app/api/sapl/documento/route.ts`.
 */

/** Prefixo de path do SAPL que o proxy aceita servir (evita open-proxy/SSRF). */
export const SAPL_MEDIA_PREFIX = '/media/'

/**
 * Converte uma URL de documento do SAPL (absoluta ou relativa) no caminho do
 * nosso proxy. Retorna null se não for um documento de mídia válido do SAPL.
 */
export function urlDocumento(saplUrl?: string | null): string | null {
  if (!saplUrl) return null
  let path = saplUrl
  try {
    // URL absoluta (http://sapl.host/media/...) → fica só o pathname.
    if (/^https?:\/\//i.test(saplUrl)) path = new URL(saplUrl).pathname
  } catch {
    return null
  }
  if (!path.startsWith(SAPL_MEDIA_PREFIX)) return null
  return `/api/sapl/documento?p=${encodeURIComponent(path)}`
}
