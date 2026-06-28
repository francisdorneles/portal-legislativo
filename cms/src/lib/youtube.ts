export interface VideoYoutube {
  id: string
  titulo: string
  publicado: string
  thumb: string
  url: string
}

/**
 * Resolve qualquer forma de referência ao canal YouTube para um channel ID (UCxxx).
 * Aceita: URL com /channel/UCxxx, URL com /@handle, URL com /user/nome, ID direto UCxxx.
 * Para handles (@), faz uma requisição à página do canal e extrai o ID do HTML.
 */
async function resolverChannelId(input: string): Promise<string | null> {
  const s = input.trim()

  // Já é um channel ID direto
  const matchDireto = s.match(/^(UC[\w-]{20,})$/)
  if (matchDireto) return matchDireto[1]

  // URL com /channel/UCxxx
  const matchChannel = s.match(/youtube\.com\/channel\/(UC[\w-]+)/)
  if (matchChannel) return matchChannel[1]

  // URL com /@handle ou /user/nome — resolve via link RSS no <head> da página
  const matchHandle = s.match(/youtube\.com\/(@[\w.-]+|user\/[\w.-]+)/)
  if (matchHandle) {
    try {
      const url = `https://www.youtube.com/${matchHandle[1]}`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 86400 },
      })
      if (!res.ok) return null
      const html = await res.text()
      // YouTube inclui o link do RSS no <head>: feeds/videos.xml?channel_id=UCxxx
      const rssLink = html.match(/feeds\/videos\.xml\?channel_id=(UC[\w-]+)/)
      if (rssLink) return rssLink[1]
      // Fallback: procura channelId no JSON embutido
      const jsonId = html.match(/"channelId":"(UC[\w-]+)"/)
      return jsonId ? jsonId[1] : null
    } catch {
      return null
    }
  }

  return null
}

/**
 * Busca os últimos vídeos do canal via RSS público do YouTube (sem API key).
 * Aceita URL do canal em qualquer formato (@handle, /channel/UC..., ID direto).
 * Retorna array vazio silenciosamente em caso de erro.
 */
export async function obterUltimosVideos(channelUrl: string, limite = 5): Promise<VideoYoutube[]> {
  const channelId = await resolverChannelId(channelUrl)
  if (!channelId) return []

  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

  try {
    const res = await fetch(rssUrl, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []

    const xml = await res.text()
    const entries = xml.split('<entry>').slice(1).slice(0, limite)

    return entries.map((entry) => {
      const videoId = (entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) ?? [])[1] ?? ''
      const titulo = (entry.match(/<title>([^<]+)<\/title>/) ?? [])[1] ?? ''
      const publicado = (entry.match(/<published>([^<]+)<\/published>/) ?? [])[1] ?? ''
      return {
        id: videoId,
        titulo: titulo.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        publicado,
        thumb: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }
    }).filter((v) => v.id)
  } catch {
    return []
  }
}
