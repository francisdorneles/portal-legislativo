import { sapl, saplFetch, type Parlamentar, type OrdemDia, type SessaoPlenaria, type RegistroVotacao } from './sapl.client'
import { urlDocumento } from '@/lib/documentos'

export interface VotoVereador {
  parlamentarId: number
  nome: string
  voto: string
  fotoUrl: string | null
}

export interface Votacao {
  resultado: string
  sim: number
  nao: number
  abstencoes: number
  votos: VotoVereador[]
}

/**
 * Detalhe da votação de um item de pauta (Ordem do Dia): placar + voto de cada
 * vereador. Fonte: SAPL. Retorna null se o item não foi a votação nominal.
 */
export async function obterVotacaoPorOrdem(ordemId: number): Promise<Votacao | null> {
  try {
    const reg = await sapl.registroVotacao(`?ordem=${ordemId}`)
    const r = reg.results?.[0]
    if (!r) return null

    const [tiposRes, votosRes] = await Promise.all([
      sapl.tiposResultadoVotacao('?page=1'),
      sapl.votosParlamentar(`?votacao=${r.id}`),
    ])
    const tipoNome = new Map((tiposRes.results ?? []).map((t) => [t.id, t.nome]))

    const votos = await Promise.all(
      (votosRes.results ?? []).map(async (v) => {
        const p = await saplFetch<Parlamentar>(`/api/parlamentares/parlamentar/${v.parlamentar}/`).catch(() => null)
        return {
          parlamentarId: v.parlamentar,
          nome: p?.nome_parlamentar ?? `Parlamentar ${v.parlamentar}`,
          voto: v.voto ?? '—',
          fotoUrl: urlDocumento(p?.fotografia),
        }
      }),
    )
    votos.sort((a, b) => a.nome.localeCompare(b.nome))

    return {
      resultado: tipoNome.get(r.tipo_resultado_votacao) ?? 'Votação',
      sim: r.numero_votos_sim ?? 0,
      nao: r.numero_votos_nao ?? 0,
      abstencoes: r.numero_abstencoes ?? 0,
      votos,
    }
  } catch {
    return null
  }
}

/** Número de vereadores presentes numa sessão (Presença na Ordem do Dia). */
export async function contarPresentes(sessaoId: number): Promise<number> {
  try {
    const res = await sapl.presencas(`?sessao_plenaria=${sessaoId}`)
    return res.pagination?.total_entries ?? (res.results?.length ?? 0)
  } catch {
    return 0
  }
}

export interface VotacaoMateria extends Votacao {
  sessaoId: number | null
  sessaoLabel: string
  presentes: number
  data: string
  /** "1º turno" / "2º turno" quando a matéria foi votada mais de uma vez. */
  turno: string
}

/**
 * Votações de uma matéria em plenário (placar + sessão), para mostrar o desfecho
 * na página do projeto. Fonte: SAPL.
 */
export async function votacoesDaMateria(materiaId: number): Promise<VotacaoMateria[]> {
  try {
    const [reg, tiposRes] = await Promise.all([
      sapl.registroVotacao(`?materia=${materiaId}`),
      sapl.tiposResultadoVotacao('?page=1'),
    ])
    const tipoNome = new Map((tiposRes.results ?? []).map((t) => [t.id, t.nome]))

    const lista: VotacaoMateria[] = await Promise.all(
      (reg.results ?? []).map(async (r: RegistroVotacao) => {
        let sessaoId: number | null = null
        let sessaoLabel = ''
        let presentes = 0
        let data = ''
        if (r.ordem) {
          const od = await saplFetch<OrdemDia>(`/api/sessao/ordemdia/${r.ordem}/`).catch(() => null)
          if (od?.sessao_plenaria) {
            sessaoId = od.sessao_plenaria
            const [s, pres] = await Promise.all([
              saplFetch<SessaoPlenaria>(`/api/sessao/sessaoplenaria/${sessaoId}/`).catch(() => null),
              sapl.presencas(`?sessao_plenaria=${sessaoId}`).then((p) => p.pagination?.total_entries ?? 0).catch(() => 0),
            ])
            if (s) { sessaoLabel = `${s.numero}ª sessão (${s.data_inicio})`; data = s.data_inicio ?? '' }
            presentes = pres
          }
        }

        // Voto nominal de cada vereador.
        const votosRes = await sapl.votosParlamentar(`?votacao=${r.id}`)
        const votos = await Promise.all(
          (votosRes.results ?? []).map(async (v) => {
            const p = await saplFetch<Parlamentar>(`/api/parlamentares/parlamentar/${v.parlamentar}/`).catch(() => null)
            return {
              parlamentarId: v.parlamentar,
              nome: p?.nome_parlamentar ?? `Parlamentar ${v.parlamentar}`,
              voto: v.voto ?? '—',
              fotoUrl: urlDocumento(p?.fotografia),
            }
          }),
        )
        votos.sort((a, b) => a.nome.localeCompare(b.nome))

        return {
          resultado: tipoNome.get(r.tipo_resultado_votacao) ?? 'Votação',
          sim: r.numero_votos_sim ?? 0,
          nao: r.numero_votos_nao ?? 0,
          abstencoes: r.numero_abstencoes ?? 0,
          votos,
          sessaoId,
          sessaoLabel,
          presentes,
          data,
          turno: '',
        }
      }),
    )

    // Ordena por data e rotula turnos quando há mais de uma votação.
    lista.sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''))
    if (lista.length > 1) {
      lista.forEach((v, i) => { v.turno = `${i + 1}º turno` })
    }
    return lista
  } catch {
    return []
  }
}
