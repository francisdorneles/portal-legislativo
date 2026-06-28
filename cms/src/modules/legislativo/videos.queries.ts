import { sapl } from './sapl.client'

/** Um vídeo do acervo (de uma sessão ou audiência), com miniatura quando YouTube. */
export interface VideoItem {
  id: string
  titulo: string
  data: string
  url: string
  thumb?: string
  href: string
}

/** Extrai o ID de um vídeo do YouTube (vários formatos de URL), ou null. */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/|v\/))([\w-]{11})/)
  return m ? m[1] : null
}

function thumbDe(url: string): string | undefined {
  const id = youtubeId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined
}

async function mapaTiposSessao(): Promise<Map<number, string>> {
  try {
    const res = await sapl.tiposSessao('?page=1')
    return new Map((res.results ?? []).map((t) => [t.id, t.nome]))
  } catch {
    return new Map()
  }
}

/**
 * Acervo de vídeos: sessões plenárias e audiências públicas que têm `url_video`,
 * mais recentes primeiro. Fonte: SAPL.
 */
export async function listarVideos(): Promise<VideoItem[]> {
  try {
    const [sessRes, audRes, tipos] = await Promise.all([
      sapl.sessoes('?page=1'),
      sapl.audiencias('?page=1'),
      mapaTiposSessao(),
    ])

    const sessoes: VideoItem[] = (sessRes.results ?? [])
      .filter((s) => s.url_video)
      .map((s) => ({
        id: `s${s.id}`,
        titulo: `${s.numero}ª ${tipos.get(s.tipo) ?? 'Sessão Plenária'}`,
        data: s.data_inicio ?? '',
        url: s.url_video!,
        thumb: thumbDe(s.url_video!),
        href: `/sessoes/${s.id}`,
      }))

    const audiencias: VideoItem[] = (audRes.results ?? [])
      .filter((a) => a.url_video)
      .map((a) => ({
        id: `a${a.id}`,
        titulo: a.nome ?? 'Audiência Pública',
        data: a.data ?? '',
        url: a.url_video!,
        thumb: thumbDe(a.url_video!),
        href: '/audiencias',
      }))

    return [...sessoes, ...audiencias]
      .filter((v) => v.data)
      .sort((a, b) => b.data.localeCompare(a.data))
  } catch {
    return []
  }
}
