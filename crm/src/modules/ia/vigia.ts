'use server'

/**
 * Vigia do Diário Oficial — cruza o diário do município com os interesses do gabinete
 * (bairros do Radar + nome do vereador), resume cada achado com IA e cria Alertas.
 *
 * O diário é dado PÚBLICO (conector). O cruzamento e os alertas são ISOLADOS por gabinete.
 * Ideal rodar como job BullMQ diário; aqui também expõe trigger manual (server action).
 */
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withTenant } from '@/lib/with-tenant'
import { buscarDiario, type ItemDiario } from '@/modules/conectores/querido-diario'
import { gerar } from './gateway'

export type AchadoDiario = { data: string; url: string; resumo: string; trechos: string[] }
export type ResumoVigia = { termos: string[]; achados: AchadoDiario[]; alertasCriados: number; erro?: string }

function desde30dias(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

/** Varre o diário oficial do município do gabinete e gera alertas dos achados relevantes. */
export async function varrerDiario(opts?: { itensMock?: ItemDiario[] }): Promise<ResumoVigia> {
  const session = await auth()
  if (!session) throw new Error('não autenticado')

  return withTenant(session.tenant, async () => {
    const [camara, gab, unidades] = await Promise.all([
      prisma.camara.findUnique({ where: { id: session.tenant.camaraId }, select: { codigoIbge: true, municipio: true } }),
      prisma.gabinete.findUnique({ where: { id: session.tenant.gabineteId }, select: { candidatoTse: true } }),
      prisma.unidadeTerritorial.findMany({ select: { nome: true }, take: 6 }),
    ])
    if (!camara?.codigoIbge) return { termos: [], achados: [], alertasCriados: 0, erro: 'Câmara sem código IBGE configurado.' }

    // termos de vigilância: nome do vereador + bairros (cap p/ limitar chamadas à API)
    const termos = [gab?.candidatoTse, ...unidades.map((u) => u.nome)].filter(Boolean).slice(0, 5) as string[]

    // coleta itens (mock no teste; live via conector na produção)
    let itens: ItemDiario[] = []
    if (opts?.itensMock) {
      itens = opts.itensMock
    } else {
      for (const termo of termos) {
        const r = await buscarDiario({ ibge: camara.codigoIbge, query: termo, desde: desde30dias(), size: 5 })
        if (!r.ok) return { termos, achados: [], alertasCriados: 0, erro: r.erro }
        itens.push(...r.itens)
      }
    }

    const achados = await processarDiario(itens, camara.municipio ?? '')
    if (achados.length > 0) {
      const md = achados.map((a) => `- **${a.data}** — ${a.resumo} ([diário](${a.url}))`).join('\n')
      await prisma.conteudoIA.deleteMany({ where: { tipo: 'vigia_diario' } }) // mantém só a última
      await prisma.conteudoIA.create({
        data: { tipo: 'vigia_diario', conteudo: md, dados: achados as never } as never,
      })
    }
    return { termos, achados, alertasCriados: achados.length }
  })
}

/**
 * NÚCLEO testável (roda no contexto de tenant ambiente): dedupe → resumo IA → cria Alertas.
 * Os Alertas passam pela extensão (escopo gabinete) → isolados automaticamente.
 */
export async function processarDiario(itens: ItemDiario[], municipio: string): Promise<AchadoDiario[]> {
  const vistos = new Set<string>()
  const unicos = itens.filter((i) => (i.url && !vistos.has(i.url) ? (vistos.add(i.url), true) : false))

  const achados: AchadoDiario[] = []
  for (const item of unicos.slice(0, 8)) {
    const trecho = item.trechos.join(' … ').slice(0, 1500)
    const resumo = (
      await gerar({
        tier: 'local',
        sistema: 'Você é assessor de um vereador. Em UMA frase objetiva, diga por que este trecho do diário oficial municipal interessa ao gabinete (verba, obra, licitação, nomeação no bairro/tema). Sem floreio.',
        prompt: `Município: ${municipio}\nData: ${item.data}\nTrecho do diário:\n${trecho || '(sem trecho)'}`,
        temperatura: 0.2,
      })
    ).trim()

    await prisma.alerta.create({
      data: { tipo: 'diario', mensagem: `📰 ${item.data}: ${resumo} (${item.url})` } as never,
    })
    achados.push({ data: item.data, url: item.url, resumo, trechos: item.trechos })
  }
  return achados
}
