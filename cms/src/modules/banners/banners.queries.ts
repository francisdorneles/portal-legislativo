import { getPayloadClient } from '@/lib/payload'
import type { Banner } from '@/payload-types'

/** Banners ativos da home, ordenados pelo campo `ordem`. */
export async function listarBannersAtivos(): Promise<Banner[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'banners',
      where: { ativo: { equals: true } },
      sort: 'ordem',
      limit: 10,
      depth: 1,
    })
    return docs
  } catch {
    return []
  }
}
