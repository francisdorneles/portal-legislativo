'use server'

/**
 * Copiloto estratégico — a "agenda de rua da semana". Cruza, POR BAIRRO:
 *   - disputa eleitoral (meu/disputa/rival + votos)   [câmara]
 *   - demandas abertas                                 [gabinete]
 *   - contatos esfriando/frios                         [gabinete]
 * e pede pra IA priorizar onde ir e POR QUÊ. Sinais são AGREGADOS (sem PII) → tier fronteira.
 */
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import { mapaDisputa, normalizarBairro } from '@/modules/radar/radar.queries'
import { temperatura } from '@/modules/crm/relacionamento'
import { gerar } from './gateway'
import { salvarConteudoIA } from './conteudo'

export type SinalBairro = {
  bairro: string
  classificacao: 'meu' | 'disputa' | 'rival' | '—'
  meusVotos: number
  liderVotos: number
  demandasAbertas: number
  contatosFrios: number
}

export async function montarSinais(): Promise<SinalBairro[]> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')

  return withTenant(session.tenant, async () => {
    const gab = await prisma.gabinete.findUnique({
      where: { id: session.tenant.gabineteId },
      select: { candidatoTse: true },
    })

    const [disputa, demAbertas, cidadaos] = await Promise.all([
      gab?.candidatoTse ? mapaDisputa(gab.candidatoTse, { cargo: 'Vereador' }) : Promise.resolve([]),
      prisma.demanda.groupBy({ by: ['bairro'], where: { status: { not: 'RESOLVIDA' } }, _count: { _all: true } }),
      prisma.cidadao.findMany({ select: { bairro: true, ultimoContato: true } }),
    ])

    // índices por bairro normalizado
    const agora = new Date()
    const demPorBairro = new Map<string, number>()
    for (const g of demAbertas) if (g.bairro) demPorBairro.set(normalizarBairro(g.bairro), g._count._all)

    const friosPorBairro = new Map<string, number>()
    for (const c of cidadaos) {
      if (!c.bairro) continue
      const t = temperatura(c.ultimoContato, agora)
      if (t === 'esfriando' || t === 'frio') {
        const k = normalizarBairro(c.bairro)
        friosPorBairro.set(k, (friosPorBairro.get(k) ?? 0) + 1)
      }
    }

    // base = bairros do Radar; complementa com bairros que só têm demanda/contato
    const sinais = new Map<string, SinalBairro>()
    for (const d of disputa) {
      const k = normalizarBairro(d.bairro)
      sinais.set(k, {
        bairro: d.bairro,
        classificacao: d.classificacao,
        meusVotos: d.meusVotos,
        liderVotos: d.liderVotos,
        demandasAbertas: demPorBairro.get(k) ?? 0,
        contatosFrios: friosPorBairro.get(k) ?? 0,
      })
    }
    for (const [k, n] of demPorBairro) {
      if (!sinais.has(k)) sinais.set(k, { bairro: k, classificacao: '—', meusVotos: 0, liderVotos: 0, demandasAbertas: n, contatosFrios: friosPorBairro.get(k) ?? 0 })
    }

    return [...sinais.values()].sort(
      (a, b) =>
        ordem(a.classificacao) - ordem(b.classificacao) ||
        b.demandasAbertas + b.contatosFrios - (a.demandasAbertas + a.contatosFrios),
    )
  })
}

function ordem(c: SinalBairro['classificacao']) {
  return c === 'disputa' ? 0 : c === 'meu' ? 1 : c === 'rival' ? 2 : 3
}

/** Segunda-feira 00:00 da semana corrente — fronteira de validade da agenda. */
function inicioDaSemana(d = new Date()): Date {
  const x = new Date(d)
  const diaSeg = (x.getDay() + 6) % 7 // 0 = segunda
  x.setDate(x.getDate() - diaSeg)
  x.setHours(0, 0, 0, 0)
  return x
}

export type AgendaPersistida = { agenda: string; sinais: SinalBairro[]; createdAt: string } | null

/**
 * Agenda salva da SEMANA CORRENTE. Se a última for de uma semana anterior, ela venceu →
 * apaga e retorna null (pra forçar geração de uma nova). Isolada por gabinete.
 */
export async function agendaDaSemana(): Promise<AgendaPersistida> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return withTenant(session.tenant, async () => {
    const c = await prisma.conteudoIA.findFirst({ where: { tipo: 'agenda_semana' }, orderBy: { createdAt: 'desc' } })
    if (!c) return null
    if (c.createdAt < inicioDaSemana()) {
      await prisma.conteudoIA.deleteMany({ where: { tipo: 'agenda_semana' } }) // venceu → apaga
      return null
    }
    return { agenda: c.conteudo, sinais: (c.dados as SinalBairro[]) ?? [], createdAt: c.createdAt.toISOString() }
  })
}

export type AgendaSemana = { agenda: string; sinais: SinalBairro[] }

export async function gerarAgendaSemana(): Promise<AgendaSemana> {
  const sinais = await montarSinais()
  if (sinais.length === 0) {
    return { agenda: 'Sem sinais suficientes ainda. Importe o Radar e cadastre demandas/contatos.', sinais }
  }

  const tabela = sinais
    .map(
      (s) =>
        `- ${s.bairro}: situação=${s.classificacao}, meus_votos=${s.meusVotos}, votos_lider=${s.liderVotos}, demandas_abertas=${s.demandasAbertas}, contatos_frios=${s.contatosFrios}`,
    )
    .join('\n')

  const SISTEMA = `Você é o chefe de gabinete/estrategista de um vereador. A partir dos SINAIS por
bairro, monte a AGENDA DE RUA DA SEMANA. Priorize 3 a 5 bairros e, para CADA um, diga em
linguagem de ação, direta, O QUE FAZER e POR QUÊ. Regra de prioridade: bairros "em disputa"
com base eleitoral são onde a eleição vira; demandas abertas e contatos frios indicam trabalho
a mostrar/relacionamento a reaquecer. Seja objetivo, sem floreio. Não invente dados.`

  const prompt = `SINAIS POR BAIRRO:\n${tabela}\n\nMonte a agenda da semana (3 a 5 bairros priorizados).`
  const agenda = await gerar({ tier: 'fronteira', sistema: SISTEMA, prompt, temperatura: 0.4, maxTokens: 700 })
  await salvarConteudoIA('agenda_semana', agenda, sinais, { substituir: true })
  return { agenda, sinais }
}
