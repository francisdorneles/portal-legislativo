import type { Where } from 'payload'
import { getPayloadClient } from '@/lib/payload'

export interface DocumentoItem {
  id: number | string
  titulo: string
  categoria: string
  descricao?: string | null
  dataDocumento?: string | null
  destaque: boolean
  arquivoUrl?: string | null
}

const CATEGORIAS: Record<string, string> = {
  institucional: 'Institucional',
  regimento:     'Regimento e Legislação',
  atas:          'Atas e Resoluções',
  contratos:     'Contratos e Licitações',
  outros:        'Outros',
}

export { CATEGORIAS }

export interface DocumentosResultado {
  itens: DocumentoItem[]
  total: number
}

function arquivoUrl(doc: Record<string, unknown>): string | null {
  const arquivo = doc.arquivo as Record<string, unknown> | undefined
  if (!arquivo) return null
  const url = arquivo.url as string | undefined
  if (!url) return null
  return url.startsWith('http') ? url : `/api/media/file/${arquivo.filename as string}`
}

export async function listarDocumentos(
  opts: { categoria?: string; page?: number } = {},
): Promise<DocumentosResultado> {
  try {
    const payload = await getPayloadClient()
    const page = opts.page ?? 1
    const where: Where = {}
    if (opts.categoria) where.categoria = { equals: opts.categoria }

    const res = await payload.find({
      collection: 'documentos',
      where,
      sort: '-dataDocumento',
      page,
      limit: 20,
      depth: 1,
    })

    const itens: DocumentoItem[] = (res.docs as unknown as Record<string, unknown>[]).map((d) => ({
      id:            d.id as number | string,
      titulo:        d.titulo as string,
      categoria:     d.categoria as string,
      descricao:     d.descricao as string | null | undefined,
      dataDocumento: d.dataDocumento as string | null | undefined,
      destaque:      Boolean(d.destaque),
      arquivoUrl:    arquivoUrl(d),
    }))

    return { itens, total: res.totalDocs }
  } catch {
    return { itens: [], total: 0 }
  }
}
