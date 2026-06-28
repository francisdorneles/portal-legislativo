import type { MetadataRoute } from 'next'
import { sapl } from '@/modules/legislativo/sapl.client'
import { getPayloadClient } from '@/lib/payload'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3003'

function url(path: string) {
  return `${BASE}${path}`
}

async function coletarNormas() {
  const urls: MetadataRoute.Sitemap = []
  try {
    let page = 1
    for (;;) {
      const res = await sapl.normas(`?page=${page}`)
      for (const n of res.results ?? []) {
        urls.push({ url: url(`/legislacao/${n.id}`), lastModified: n.data_ultima_atualizacao })
      }
      if (!res.pagination?.next_page) break
      page = res.pagination.next_page
    }
  } catch { /* SAPL indisponível — sitemap parcial */ }
  return urls
}

async function coletarSessoes() {
  const urls: MetadataRoute.Sitemap = []
  try {
    let page = 1
    for (;;) {
      const res = await sapl.sessoes(`?page=${page}`)
      for (const s of res.results ?? []) {
        urls.push({ url: url(`/sessoes/${s.id}`), lastModified: s.data_ultima_atualizacao })
      }
      if (!res.pagination?.next_page) break
      page = res.pagination.next_page
    }
  } catch { /* SAPL indisponível */ }
  return urls
}

async function coletarNoticias() {
  const urls: MetadataRoute.Sitemap = []
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'noticias',
      limit: 500,
      select: { slug: true, updatedAt: true },
    })
    for (const n of docs) {
      urls.push({ url: url(`/noticias/${n.slug}`), lastModified: n.updatedAt })
    }
  } catch { /* Payload indisponível */ }
  return urls
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixas: MetadataRoute.Sitemap = [
    { url: url('/'), priority: 1 },
    { url: url('/vereadores'), priority: 0.9 },
    { url: url('/sessoes'), priority: 0.8 },
    { url: url('/processo-legislativo'), priority: 0.8 },
    { url: url('/legislacao'), priority: 0.8 },
    { url: url('/noticias'), priority: 0.7 },
    { url: url('/comissoes'), priority: 0.7 },
    { url: url('/institucional'), priority: 0.6 },
    { url: url('/transparencia'), priority: 0.6 },
    { url: url('/agenda'), priority: 0.6 },
  ]

  const [normas, sessoes, noticias] = await Promise.all([
    coletarNormas(),
    coletarSessoes(),
    coletarNoticias(),
  ])

  return [...fixas, ...normas, ...sessoes, ...noticias]
}
