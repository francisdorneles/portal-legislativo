import { sapl, saplFetch, type Parlamentar } from './sapl.client'
import { urlDocumento } from '@/lib/documentos'

const ORDEM_CARGO: Record<string, number> = {
  'Presidente': 1,
  'Vice-Presidente': 2, '1º Vice-Presidente': 2,
  '2 Vice-Presidente': 3, '2º Vice-Presidente': 3,
  '1 Secretario': 4, '1º Secretário': 4, 'Primeiro-Secretário': 4,
  '2 Secretario': 5, '2º Secretário': 5, 'Segundo-Secretário': 5,
}

export interface MembroMesa {
  parlamentarId: number
  nome: string
  cargo: string
  ordem: number
  fotoUrl: string | null
}

/**
 * Composição da Mesa Diretora vigente, ordenada por cargo. Fonte: SAPL.
 * Usa a última mesa cadastrada (composicaomesa → cargo + parlamentar).
 */
export async function obterMesaDiretora(): Promise<MembroMesa[]> {
  try {
    const [comp, cargosRes] = await Promise.all([
      sapl.composicaoMesa('?page=1'),
      sapl.cargosMesa('?page=1'),
    ])
    const cargos = new Map((cargosRes.results ?? []).map((c) => [c.id, c]))
    const itens = comp.results ?? []
    if (itens.length === 0) return []

    const membros = await Promise.all(
      itens.map(async (cm) => {
        const parl = await saplFetch<Parlamentar>(`/api/parlamentares/parlamentar/${cm.parlamentar}/`).catch(() => null)
        const cargo = cargos.get(cm.cargo)
        return {
          parlamentarId: cm.parlamentar,
          nome: parl?.nome_parlamentar ?? `Parlamentar ${cm.parlamentar}`,
          cargo: cargo?.descricao ?? 'Membro',
          ordem: cargo?.id_ordenacao ?? ORDEM_CARGO[cargo?.descricao ?? ''] ?? 99,
          fotoUrl: urlDocumento(parl?.fotografia),
        }
      }),
    )
    return membros.sort((a, b) => a.ordem - b.ordem)
  } catch {
    return []
  }
}
