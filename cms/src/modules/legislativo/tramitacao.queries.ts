import { sapl, type Tramitacao } from './sapl.client'

/** Etapa de tramitação com a descrição do status já resolvida. */
export interface EtapaTramitacao extends Tramitacao {
  statusDescricao: string
}

/** Mapa id→descrição dos status de tramitação (SAPL guarda só o id). */
async function mapaStatus(): Promise<Map<number, string>> {
  const mapa = new Map<number, string>()
  try {
    // Os status são poucas dezenas; pagina até o fim.
    let page = 1
    for (;;) {
      const res = await sapl.statusTramitacao(`?page=${page}`)
      for (const s of res.results ?? []) mapa.set(s.id, s.descricao)
      if (!res.pagination?.next_page) break
      page = res.pagination.next_page
    }
  } catch {
    /* mapa vazio — cai no rótulo genérico */
  }
  return mapa
}

/**
 * Histórico de tramitação de uma matéria, do mais recente para o mais antigo.
 * Dados oficiais do SAPL.
 */
export async function listarTramitacao(materiaId: number): Promise<EtapaTramitacao[]> {
  try {
    const [res, status] = await Promise.all([
      sapl.tramitacoes(`?materia=${materiaId}`),
      mapaStatus(),
    ])
    return (res.results ?? [])
      .map((t) => ({
        ...t,
        statusDescricao: t.status ? (status.get(t.status) ?? 'Tramitação') : 'Tramitação',
      }))
      .sort((a, b) => (b.data_tramitacao ?? '').localeCompare(a.data_tramitacao ?? ''))
  } catch {
    return []
  }
}
