import { sapl, type DocumentoAdministrativo } from './sapl.client'

/** Documento administrativo já com rótulo e ementa prontos para a UI. */
export interface DocumentoAdm {
  id: number
  titulo: string
  assunto: string
  interessado?: string
  data?: string
  emTramitacao: boolean
  urlDocumento?: string
}

export interface ProtocoloResultado {
  itens: DocumentoAdm[]
  total: number
}

function montar(d: DocumentoAdministrativo): DocumentoAdm {
  return {
    id: d.id,
    // __str__ já vem no formato "OFI Nº 001/2026 - Ofício" (não exige resolver o tipo,
    // que é restrito no endpoint público do SAPL).
    titulo: d.__str__ ?? `Documento ${d.numero}/${String(d.ano)}`,
    assunto: d.assunto ?? '',
    interessado: d.interessado || undefined,
    data: d.data,
    emTramitacao: Boolean(d.tramitacao),
    urlDocumento: d.texto_integral || undefined,
  }
}

/**
 * Lista documentos administrativos (protocolo administrativo da Câmara).
 * O SAPL já omite os de acesso restrito no endpoint público; ainda assim
 * filtramos `restrito` por garantia. Mais recentes primeiro. Fonte: SAPL.
 */
export async function listarDocumentosAdministrativos(
  opts: { page?: number; q?: string; de?: string; ate?: string } = {},
): Promise<ProtocoloResultado> {
  try {
    const page = opts.page ?? 1
    const p = new URLSearchParams({ page: String(page) })
    if (opts.q?.trim()) p.set('assunto__icontains', opts.q.trim())
    if (opts.de) p.set('data__gte', opts.de)
    if (opts.ate) p.set('data__lte', opts.ate)

    const res = await sapl.documentosAdministrativos(`?${p.toString()}`)
    // O SAPL já omite restritos no endpoint público; filtramos por garantia.
    const docs = (res.results ?? []).filter((d) => !d.restrito)
    const itens = docs.map(montar).sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))

    return { itens, total: res.pagination?.total_entries ?? itens.length }
  } catch {
    return { itens: [], total: 0 }
  }
}
