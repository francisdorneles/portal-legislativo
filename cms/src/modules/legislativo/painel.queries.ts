import { sapl, saplFetch, type SessaoPlenaria, type OrdemDia, type MateriaLegislativa } from './sapl.client'

/** Estado do painel eletrônico para exibição ao vivo. */
export interface PainelEstado {
  aoVivo: boolean
  atualizadoEm: string
  sessao?: {
    id: number
    numero: number
    tipoNome: string
    dataInicio?: string
    horaInicio?: string
  }
  itemAtual?: {
    materiaId: number
    titulo: string
    ementa: string
    numeroOrdem: number
  }
  totalItens?: number
  itensConcluidos?: number
  presentes?: number
}

/** Sem cache: o painel é ao vivo, cada chamada reflete o estado atual do SAPL. */
const SEM_CACHE = { revalidate: 0 }

/**
 * Estado atual do painel eletrônico. Considera "ao vivo" quando há um registro
 * de Painel aberto no SAPL e uma sessão plenária em andamento (sem data_fim) na
 * mesma data. Retorna o item da Ordem do Dia em apreciação (primeiro sem
 * resultado), presentes e progresso da pauta. Fonte: SAPL (via proxy server-side).
 */
export async function painelAoVivo(): Promise<PainelEstado> {
  const agora = new Date().toISOString()
  const fechado: PainelEstado = { aoVivo: false, atualizadoEm: agora }
  try {
    const painelRes = await sapl.painel('?page=1', SEM_CACHE)
    const aberto = (painelRes.results ?? []).find((p) => p.aberto)
    if (!aberto) return fechado

    // Sessão em andamento na data do painel (sem data_fim preenchido).
    const sessoesRes = await saplFetch<{ results?: SessaoPlenaria[] }>(
      `/api/sessao/sessaoplenaria/?data_inicio=${aberto.data_painel}`,
      SEM_CACHE,
    )
    const sessao = (sessoesRes.results ?? []).find((s) => !s.data_fim)
    if (!sessao) return fechado

    const [tiposRes, ordensRes] = await Promise.all([
      sapl.tiposSessao('?page=1'),
      sapl.ordemDia(`?sessao_plenaria=${sessao.id}`, SEM_CACHE),
    ])
    const tipoNome = new Map((tiposRes.results ?? []).map((t) => [t.id, t.nome])).get(sessao.tipo) ?? 'Sessão Plenária'

    const ordens = (ordensRes.results ?? []).sort((a, b) => (a.numero_ordem ?? 0) - (b.numero_ordem ?? 0))
    const emApreciacao: OrdemDia | undefined = ordens.find((o) => !o.resultado)
    const concluidos = ordens.filter((o) => o.resultado).length

    let itemAtual: PainelEstado['itemAtual']
    if (emApreciacao) {
      const m = await saplFetch<MateriaLegislativa>(
        `/api/materia/materialegislativa/${emApreciacao.materia}/`,
        SEM_CACHE,
      ).catch(() => null)
      itemAtual = {
        materiaId: emApreciacao.materia,
        titulo: m?.__str__ ?? `Matéria ${emApreciacao.materia}`,
        ementa: m?.ementa ?? '',
        numeroOrdem: emApreciacao.numero_ordem ?? 0,
      }
    }

    const presencaRes = await sapl.presencas(`?sessao_plenaria=${sessao.id}`, SEM_CACHE).catch(() => null)
    const presentes = presencaRes?.pagination?.total_entries ?? presencaRes?.results?.length

    return {
      aoVivo: true,
      atualizadoEm: agora,
      sessao: {
        id: sessao.id,
        numero: sessao.numero,
        tipoNome,
        dataInicio: sessao.data_inicio,
        horaInicio: sessao.hora_inicio,
      },
      itemAtual,
      totalItens: ordens.length,
      itensConcluidos: concluidos,
      presentes,
    }
  } catch {
    return fechado
  }
}
