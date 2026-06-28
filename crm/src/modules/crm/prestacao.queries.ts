/**
 * Prestação de contas por bairro — "seu vereador trabalhou aqui".
 *
 * Transforma o trabalho do gabinete (demandas + comunicações) em prova territorial que o
 * vereador mostra pro bairro (WhatsApp/impressão). É o lado "orgulho/munição" do Radar.
 *
 * Tudo gabinete-escopo, isolado pela extensão (withTenant). O bairro casa pelo texto livre
 * da demanda — padronizado pelo datalist do form (bairros conhecidos do Radar).
 */
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import type { TenantContext } from '@/lib/tenant-context'

async function tenant(): Promise<TenantContext> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')
  return session.tenant
}

export type BairroResumo = { bairro: string; total: number; resolvidas: number }

/** Bairros que têm demandas no gabinete, com contagem — para o seletor da prestação. */
export async function listarBairrosComDemandas(): Promise<BairroResumo[]> {
  return withTenant(await tenant(), async () => {
    const rows = await prisma.demanda.groupBy({
      by: ['bairro', 'status'],
      where: { bairro: { not: null } },
      _count: { _all: true },
    })
    const acc = new Map<string, BairroResumo>()
    for (const r of rows) {
      const bairro = r.bairro as string
      const cur = acc.get(bairro) ?? { bairro, total: 0, resolvidas: 0 }
      cur.total += r._count._all
      if (r.status === 'RESOLVIDA') cur.resolvidas += r._count._all
      acc.set(bairro, cur)
    }
    return [...acc.values()].sort((a, b) => b.resolvidas - a.resolvidas || b.total - a.total)
  })
}

export type DemandaResolvida = { titulo: string; tema: string | null; cidadao: string | null }
export type PrestacaoBairro = {
  bairro: string
  total: number
  resolvidas: number
  emAndamento: number
  temas: { tema: string; quantidade: number }[]
  resolvidasLista: DemandaResolvida[]
  comunicacoes: number
}

/** Relatório de prestação de contas de um bairro. */
export async function prestacaoDoBairro(bairro: string): Promise<PrestacaoBairro> {
  return withTenant(await tenant(), async () => {
    const demandas = await prisma.demanda.findMany({
      where: { bairro },
      select: { titulo: true, tema: true, status: true, cidadao: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const resolvidasLista = demandas
      .filter((d) => d.status === 'RESOLVIDA')
      .map((d) => ({ titulo: d.titulo, tema: d.tema, cidadao: d.cidadao?.nome ?? null }))

    const temasMap = new Map<string, number>()
    for (const d of demandas) {
      const t = d.tema?.trim() || 'Outros'
      temasMap.set(t, (temasMap.get(t) ?? 0) + 1)
    }

    const comunicacoes = await prisma.comunicacaoEnviada.count({
      where: { tipo: 'demanda_resolvida', demandaId: { not: null } },
    })

    return {
      bairro,
      total: demandas.length,
      resolvidas: resolvidasLista.length,
      emAndamento: demandas.filter((d) => d.status === 'EM_ANDAMENTO' || d.status === 'ENCAMINHADA').length,
      temas: [...temasMap.entries()]
        .map(([tema, quantidade]) => ({ tema, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade),
      resolvidasLista,
      comunicacoes,
    }
  })
}

/** Texto pronto pra WhatsApp/copiar — prova de trabalho do bairro, em linguagem de rua. */
export function textoPrestacaoWhatsApp(p: PrestacaoBairro, nomeVereador?: string): string {
  const quem = nomeVereador ? `O gabinete do(a) ${nomeVereador}` : 'Nosso gabinete'
  const linhas = [
    `📍 *Prestação de contas — ${p.bairro}*`,
    '',
    `${quem} trabalhou aqui no seu bairro:`,
    `✅ ${p.resolvidas} demanda(s) resolvida(s)`,
    `🔧 ${p.emAndamento} em andamento`,
    `📨 ${p.comunicacoes} retorno(s) ao cidadão`,
  ]
  if (p.resolvidasLista.length) {
    linhas.push('', '*O que entregamos:*')
    for (const d of p.resolvidasLista.slice(0, 10)) {
      linhas.push(`• ${d.titulo}${d.tema ? ` (${d.tema})` : ''}`)
    }
    if (p.resolvidasLista.length > 10) linhas.push(`…e mais ${p.resolvidasLista.length - 10}.`)
  }
  linhas.push('', 'Conte com a gente. 🙌')
  return linhas.join('\n')
}
