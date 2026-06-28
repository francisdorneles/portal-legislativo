import { getPayloadClient } from '@/lib/payload'

export type FaqItem = { id: number; pergunta: string; resposta?: unknown; ordem?: number }

export async function listarFaq(): Promise<FaqItem[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'faq', sort: 'ordem', limit: 100 })
  return res.docs as FaqItem[]
}
