import { sapl, saplFetch, type Relatoria, type Comissao, type Parlamentar } from './sapl.client'

export interface ParecerComissao {
  id: number
  comissao: string
  relator: string
  conclusao: string
  texto: string
}

/** Códigos de conclusão do SAPL → rótulo legível. */
const CONCLUSAO: Record<string, string> = {
  FAV: 'Favorável',
  CON: 'Contrário',
  FAS: 'Favorável com substitutivo',
  FAE: 'Favorável com emenda',
}

/** Pareceres das comissões sobre uma matéria (com comissão e relator). Fonte: SAPL. */
export async function pareceresDaMateria(materiaId: number): Promise<ParecerComissao[]> {
  try {
    const res = await sapl.pareceres(`?materia=${materiaId}`)
    return await Promise.all(
      (res.results ?? []).map(async (p) => {
        const rel = await saplFetch<Relatoria>(`/api/materia/relatoria/${p.relatoria}/`).catch(() => null)
        const [com, parl] = await Promise.all([
          rel?.comissao
            ? saplFetch<Comissao>(`/api/comissoes/comissao/${rel.comissao}/`).catch(() => null)
            : Promise.resolve(null),
          rel?.parlamentar
            ? saplFetch<Parlamentar>(`/api/parlamentares/parlamentar/${rel.parlamentar}/`).catch(() => null)
            : Promise.resolve(null),
        ])
        return {
          id: p.id,
          comissao: com?.nome ?? 'Comissão',
          relator: parl?.nome_parlamentar ?? '',
          conclusao: CONCLUSAO[p.tipo_conclusao ?? ''] ?? (p.tipo_conclusao || 'Parecer'),
          texto: p.parecer ?? '',
        }
      }),
    )
  } catch {
    return []
  }
}
