import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { buscarDemanda } from '@/modules/crm/demandas.queries'
import { mudarStatusDemanda } from '@/modules/crm/demandas.actions'
import MapaPickerClient from '@/components/mapa/MapaPickerClient'
import { ProposicaoIA } from '@/components/ProposicaoIA'

const campo = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900'

const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  ENCAMINHADA: 'Encaminhada',
  RESOLVIDA: 'Resolvida',
}
const STATUS_COR: Record<string, string> = {
  ABERTA: 'bg-amber-100 text-amber-800',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-800',
  ENCAMINHADA: 'bg-violet-100 text-violet-800',
  RESOLVIDA: 'bg-green-100 text-green-800',
}

function dataBR(d: Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d)
}

export default async function DemandaDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const d = await buscarDemanda(id)
  if (!d) notFound()

  const mudar = mudarStatusDemanda.bind(null, id)

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/dashboard/demandas" className="text-sm text-slate-500 hover:underline">
        ← demandas
      </Link>

      <div className="mb-6 mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{d.titulo}</h1>
          <p className="text-sm text-slate-500">
            {[d.tema, d.bairro, d.cidadao?.nome].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COR[d.status]}`}>
          {STATUS_LABEL[d.status]}
        </span>
      </div>

      {d.descricao && <p className="mb-6 whitespace-pre-wrap text-sm text-slate-700">{d.descricao}</p>}

      <ProposicaoIA demandaId={d.id} />

      <form action={mudar} className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Mudar status</h2>
        <select name="status" defaultValue={d.status} className={campo}>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input name="nota" placeholder="Nota (o que foi feito)" className={campo} />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Registrar
        </button>
      </form>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Localização</h2>
        <MapaPickerClient demandaId={d.id} lat={d.lat} lng={d.lng} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Histórico</h2>
      <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
        {d.movimentacoes.length === 0 && <li className="text-sm text-slate-500">Sem movimentações ainda.</li>}
        {d.movimentacoes.map((m) => (
          <li key={m.id} className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400" />
            <p className="text-sm text-slate-800">
              {m.de ? `${STATUS_LABEL[m.de]} → ` : ''}
              <span className="font-medium">{STATUS_LABEL[m.para]}</span>
            </p>
            {m.nota && <p className="text-sm text-slate-600">{m.nota}</p>}
            <p className="text-xs text-slate-400">{dataBR(m.createdAt)}</p>
          </li>
        ))}
      </ol>
    </main>
  )
}
