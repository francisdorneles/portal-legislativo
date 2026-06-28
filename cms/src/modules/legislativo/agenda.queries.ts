import { sapl } from './sapl.client'

/** Um compromisso da agenda oficial (sessão ou audiência), já normalizado. */
export interface EventoAgenda {
  id: string
  tipo: 'sessao' | 'audiencia'
  titulo: string
  subtitulo?: string
  data: string
  hora?: string
  horaFim?: string
  href: string
  passado: boolean
  cancelado?: boolean
}

async function mapaTiposSessao(): Promise<Map<number, string>> {
  try {
    const res = await sapl.tiposSessao('?page=1')
    return new Map((res.results ?? []).map((t) => [t.id, t.nome]))
  } catch {
    return new Map()
  }
}

/**
 * Agenda oficial: sessões plenárias + audiências públicas, ordenadas por data.
 * Por padrão lista da data de hoje em diante; com `incluirPassado` traz também
 * os já realizados (mais recentes primeiro). Usa filtro de data na API do SAPL
 * para não trazer registros desnecessários. Fonte: SAPL.
 */
export async function eventosAgenda(
  opts: { incluirPassado?: boolean; hoje?: Date } = {},
): Promise<EventoAgenda[]> {
  const hoje = opts.hoje ?? new Date()
  const hojeIso = hoje.toISOString().slice(0, 10)

  try {
    const [tipos, sessRes, audRes] = await Promise.all([
      mapaTiposSessao(),
      opts.incluirPassado
        ? sapl.sessoes('?page=1')
        : sapl.sessoes(`?data_inicio__gte=${hojeIso}&page=1`),
      opts.incluirPassado
        ? sapl.audiencias('?page=1')
        : sapl.audiencias(`?data__gte=${hojeIso}&page=1`),
    ])

    const sessoes: EventoAgenda[] = (sessRes.results ?? []).map((s) => ({
      id: `s${s.id}`,
      tipo: 'sessao' as const,
      titulo: `${s.numero}ª ${tipos.get(s.tipo) ?? 'Sessão Plenária'}`,
      data: s.data_inicio ?? '',
      hora: s.hora_inicio ?? undefined,
      horaFim: s.hora_fim ?? undefined,
      href: `/sessoes/${s.id}`,
      passado: (s.data_inicio ?? '') < hojeIso,
    }))

    const audiencias: EventoAgenda[] = (audRes.results ?? []).map((a) => ({
      id: `a${a.id}`,
      tipo: 'audiencia' as const,
      titulo: a.nome ?? 'Audiência Pública',
      subtitulo: a.tema ?? undefined,
      data: a.data ?? '',
      hora: a.hora_inicio ?? undefined,
      horaFim: a.hora_fim ?? undefined,
      href: `/sessoes`,
      passado: (a.data ?? '') < hojeIso,
      cancelado: (a.audiencia_cancelada as string | undefined) === 'C',
    }))

    let eventos = [...sessoes, ...audiencias].filter((e) => e.data)
    if (!opts.incluirPassado) eventos = eventos.filter((e) => !e.passado)

    return eventos.sort((a, b) => {
      if (a.passado !== b.passado) return a.passado ? 1 : -1
      const ord = a.passado ? -1 : 1
      const d = a.data.localeCompare(b.data) * ord
      if (d !== 0) return d
      return (a.hora ?? '').localeCompare(b.hora ?? '') * ord
    })
  } catch {
    return []
  }
}
