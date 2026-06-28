import { sapl, saplFetch, type Autor } from './sapl.client'

export interface AutorMateria {
  nome: string
  /** id do parlamentar (para link ao perfil), quando o autor é um vereador. */
  parlamentarId: number | null
  primeiro: boolean
}

/** Autores de uma matéria (com link ao perfil quando for parlamentar). Fonte: SAPL. */
export async function autoresDaMateria(materiaId: number): Promise<AutorMateria[]> {
  try {
    const res = await sapl.autorias(`?materia=${materiaId}`)
    const autores = await Promise.all(
      (res.results ?? []).map(async (a) => {
        const autor = await saplFetch<Autor>(`/api/base/autor/${a.autor}/`).catch(() => null)
        // tipo 2 = Parlamentar → object_id é o id do parlamentar (vira link).
        const parlamentarId = autor?.tipo === 2 ? (autor?.object_id ?? null) : null
        return {
          nome: autor?.nome ?? 'Autor',
          parlamentarId,
          primeiro: Boolean(a.primeiro_autor),
        }
      }),
    )
    // Primeiro autor primeiro.
    return autores.sort((a, b) => Number(b.primeiro) - Number(a.primeiro))
  } catch {
    return []
  }
}
