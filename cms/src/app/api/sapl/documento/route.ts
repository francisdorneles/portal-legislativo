import { NextRequest } from 'next/server'
import { camara } from '@/lib/camara.config'
import { SAPL_MEDIA_PREFIX } from '@/lib/documentos'

/**
 * Proxy de documentos do SAPL. O público acessa /api/sapl/documento?p=/media/...;
 * o Next busca no SAPL (no servidor) e devolve cacheado. Assim o cidadão nunca
 * fala direto com o SAPL (regra do projeto) e os links ficam estáveis.
 *
 * Segurança: só serve paths sob /media/ (sem isso, viraria open-proxy/SSRF).
 */
export const revalidate = 3600

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get('p')

  if (!p || !p.startsWith(SAPL_MEDIA_PREFIX) || p.includes('..')) {
    return new Response('Documento inválido.', { status: 400 })
  }

  try {
    const upstream = await fetch(`${camara.saplBase}${p}`, {
      next: { revalidate },
    } as RequestInit)

    if (!upstream.ok || !upstream.body) {
      return new Response('Documento não encontrado.', { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', upstream.headers.get('Content-Type') ?? 'application/octet-stream')
    const len = upstream.headers.get('Content-Length')
    if (len) headers.set('Content-Length', len)
    headers.set('Content-Disposition', 'inline')
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')

    return new Response(upstream.body, { status: 200, headers })
  } catch {
    return new Response('Erro ao obter o documento.', { status: 502 })
  }
}
