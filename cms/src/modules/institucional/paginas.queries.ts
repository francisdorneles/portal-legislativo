import { getPayloadClient } from '@/lib/payload'
import type { Pagina } from '@/payload-types'

export type PaginaMenu = {
  slug: string
  titulo: string
  menuGrupo: string
  menuLabel?: string | null
  menuDesc?: string | null
  menuIcone?: string | null
}

/** Páginas com vínculo de menu definido — usadas para montar o menu dinâmico. */
export async function listarPaginasMenu(): Promise<PaginaMenu[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'paginas',
      where: { menuGrupo: { not_equals: '' } },
      select: { slug: true, titulo: true, menuGrupo: true, menuLabel: true, menuDesc: true, menuIcone: true } as Record<string, boolean>,
      sort: 'titulo',
      limit: 200,
    })
    return (docs as unknown as PaginaMenu[]).filter((d) => d.menuGrupo)
  } catch {
    return []
  }
}

/** Todas as páginas institucionais, ordenadas por título. */
export async function listarPaginas(): Promise<Pagina[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'paginas',
      sort: 'titulo',
      limit: 100,
    })
    return docs
  } catch {
    return []
  }
}

/** Uma página institucional pelo slug, ou null. */
export async function obterPaginaPorSlug(slug: string): Promise<Pagina | null> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'paginas',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}
