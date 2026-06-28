import { getPayloadClient } from '@/lib/payload'
import type { Noticia } from '@/payload-types'

/** Notícias publicadas, mais recentes primeiro. */
export async function listarNoticiasPublicadas(limit = 20): Promise<Noticia[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'noticias',
      where: { publicado: { equals: true } },
      sort: '-data',
      limit,
      depth: 1,
    })
    return docs
  } catch {
    return []
  }
}

/** Uma notícia publicada pelo slug, ou null. */
export async function obterNoticiaPorSlug(slug: string): Promise<Noticia | null> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'noticias',
      where: { slug: { equals: slug }, publicado: { equals: true } },
      limit: 1,
      depth: 1,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}
