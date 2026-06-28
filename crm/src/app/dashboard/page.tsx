import Link from 'next/link'
import { estatisticasDashboard } from '@/modules/crm/dashboard.queries'
import { listarAlertasPendentes } from '@/modules/crm/alertas.queries'
import { mapaDisputaParaPagina } from '@/modules/radar/radar.ui'
import { PageHeader, Panel, PanelHeader, Table, Th, Td, Badge, ButtonLink } from '@/components/ui/primitives'

const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  ENCAMINHADA: 'Encaminhada',
  RESOLVIDA: 'Resolvida',
}
const STATUS_TONE = { ABERTA: 'amber', EM_ANDAMENTO: 'blue', ENCAMINHADA: 'violet', RESOLVIDA: 'green' } as const

export default async function VisaoGeral() {
  const [stats, alertas, disputa] = await Promise.all([
    estatisticasDashboard(),
    listarAlertasPendentes(),
    mapaDisputaParaPagina(),
  ])
  const { cidadaos, demandas, recentes, relacionamento } = stats

  const totalRel = Math.max(1, relacionamento.quente + relacionamento.esfriando + relacionamento.frio)
  const pct = (n: number) => `${(n / totalRel) * 100}%`
  const cutuca = alertas.filter((a) => a.tipo === 'relacionamento_frio').length
  const niver = alertas.filter((a) => a.tipo === 'aniversario').length

  return (
    <div className="p-8">
      <PageHeader title="Visão geral" subtitle="Pulso do seu gabinete em Taquari hoje." />

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Cidadãos na base" valor={cidadaos} cor="bg-blue-600" href="/dashboard/cidadaos" />
        <Kpi label="Demandas abertas" valor={demandas.ABERTA} cor="bg-amber-500" href="/dashboard/demandas" />
        <Kpi label="Resolvidas" valor={demandas.RESOLVIDA} cor="bg-green-600" href="/dashboard/demandas" />
        <Kpi label="Bairros no radar" valor={disputa.bairros.length} cor="bg-violet-600" href="/dashboard/radar" />
      </div>

      {/* termômetro + disputa */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <PanelHeader title="Termômetro de relacionamento" action={<Link href="/dashboard/cidadaos" className="text-xs font-semibold text-blue-700 hover:underline">Ver base →</Link>} />
          <div className="p-5">
            <div className="mb-3 flex h-3 overflow-hidden rounded-full ring-1 ring-black/5">
              <span style={{ width: pct(relacionamento.quente) }} className="bg-green-600" />
              <span style={{ width: pct(relacionamento.esfriando) }} className="bg-amber-500" />
              <span style={{ width: pct(relacionamento.frio) }} className="bg-slate-400" />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <Leg cor="bg-green-600" label="Quentes" n={relacionamento.quente} />
              <Leg cor="bg-amber-500" label="Esfriando" n={relacionamento.esfriando} />
              <Leg cor="bg-slate-400" label="Frios" n={relacionamento.frio} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Mini titulo="⚠️ Cutuca de hoje" valor={`${cutuca} contato(s)`} />
              <Mini titulo="🎂 Aniversariantes" valor={`${niver} hoje`} />
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Mapa de disputa" action={<Link href="/dashboard/radar/disputa" className="text-xs font-semibold text-blue-700 hover:underline">Abrir →</Link>} />
          <div className="space-y-2.5 p-5">
            <DispRow tone="green" label="Meu território" n={disputa.resumo.meu} />
            <DispRow tone="amber" label="Em disputa" n={disputa.resumo.disputa} />
            <DispRow tone="red" label="Do rival" n={disputa.resumo.rival} />
            <p className="text-pretty border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500">
              {disputa.candidatoTse
                ? `Como ${disputa.candidatoTse}: defenda o que é seu, brigue pelo que está em disputa.`
                : 'Vincule o candidato do gabinete para ver a disputa por bairro.'}
            </p>
          </div>
        </Panel>
      </div>

      {/* demandas recentes */}
      <Panel>
        <PanelHeader title="Demandas recentes" action={<Link href="/dashboard/demandas" className="text-xs font-semibold text-blue-700 hover:underline">Todas →</Link>} />
        {recentes.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Nenhuma demanda ainda.</p>
        ) : (
          <Table>
            <thead>
              <tr className="border-y border-border bg-muted/50">
                <Th>Demanda</Th>
                <Th>Bairro</Th>
                <Th>Cidadão</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-muted/40">
                  <Td>
                    <Link href={`/dashboard/demandas/${d.id}`} className="font-medium text-foreground hover:underline">
                      {d.titulo}
                    </Link>
                  </Td>
                  <Td>{d.bairro || <span className="text-muted-foreground">—</span>}</Td>
                  <Td>{d.cidadao?.nome || <span className="text-muted-foreground">—</span>}</Td>
                  <Td className="text-right">
                    <Badge tone={STATUS_TONE[d.status as keyof typeof STATUS_TONE]} dot>
                      {STATUS_LABEL[d.status]}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  )
}

function Kpi({ label, valor, cor, href }: { label: string; valor: number; cor: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <span className={`h-2 w-2 rounded-full ${cor}`} />
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{valor}</p>
    </Link>
  )
}

function Leg({ cor, label, n }: { cor: string; label: string; n: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${cor}`} />
      {label} <b className="tabular-nums text-slate-900">{n}</b>
    </span>
  )
}

function Mini({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className="mt-0.5 font-semibold text-slate-900">{valor}</p>
    </div>
  )
}

function DispRow({ tone, label, n }: { tone: 'green' | 'amber' | 'red'; label: string; n: number }) {
  const bg = { green: 'bg-green-600', amber: 'bg-amber-500', red: 'bg-red-600' }[tone]
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${bg}`}>{label}</span>
      <b className="tabular-nums text-slate-900">{n}</b>
      <span className="text-slate-500">bairro(s)</span>
    </div>
  )
}
