import Link from 'next/link'
import { auth } from '@/auth'
import { withTenant } from '@/lib/with-tenant'
import { prisma } from '@/lib/prisma'
import {
  listarBairrosComDemandas,
  prestacaoDoBairro,
  textoPrestacaoWhatsApp,
} from '@/modules/crm/prestacao.queries'
import { PrestacaoAcoes } from '@/components/PrestacaoAcoes'

async function nomeVereador(): Promise<string | undefined> {
  const session = await auth()
  if (!session) return undefined
  return withTenant(session.tenant, async () => {
    const g = await prisma.gabinete.findUnique({
      where: { id: session.tenant.gabineteId },
      select: { candidatoTse: true, nome: true },
    })
    return g?.candidatoTse ?? g?.nome ?? undefined
  })
}

export default async function PrestacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ bairro?: string }>
}) {
  const { bairro } = await searchParams

  if (!bairro) {
    const bairros = await listarBairrosComDemandas()
    return (
      <div className="p-8">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Prestação de contas</h1>
        <p className="mb-6 text-sm text-slate-500">
          Escolha um bairro para gerar a prova de trabalho do gabinete ali — pronta pra WhatsApp ou
          impressão.
        </p>
        {bairros.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Nenhuma demanda com bairro ainda. Cadastre demandas com o bairro preenchido.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bairros.map((b) => (
              <Link
                key={b.bairro}
                href={`/dashboard/prestacao?bairro=${encodeURIComponent(b.bairro)}`}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-900"
              >
                <div className="font-medium text-slate-900">{b.bairro}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {b.resolvidas} resolvida(s) · {b.total} no total
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  const [p, nome] = await Promise.all([prestacaoDoBairro(bairro), nomeVereador()])
  const texto = textoPrestacaoWhatsApp(p, nome)

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link href="/dashboard/prestacao" className="text-sm text-slate-500 hover:underline print:hidden">
        ← Outros bairros
      </Link>

      <div className="mt-3 mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Prestação de contas</h1>
          <p className="text-sm text-slate-500">
            {p.bairro}
            {nome ? ` · ${nome}` : ''}
          </p>
        </div>
      </div>

      <PrestacaoAcoes texto={texto} />

      {/* documento (também é o que sai na impressão) */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">📍 {p.bairro}</h2>
        <p className="mt-1 text-sm text-slate-500">Trabalho do gabinete neste bairro</p>

        <div className="my-4 grid grid-cols-3 gap-3 text-center">
          <Stat valor={p.resolvidas} label="resolvidas" cor="text-green-700" />
          <Stat valor={p.emAndamento} label="em andamento" cor="text-blue-700" />
          <Stat valor={p.comunicacoes} label="retornos" cor="text-violet-700" />
        </div>

        {p.temas.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Temas atendidos</h3>
            <div className="flex flex-wrap gap-2">
              {p.temas.map((t) => (
                <span key={t.tema} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {t.tema} · {t.quantidade}
                </span>
              ))}
            </div>
          </div>
        )}

        {p.resolvidasLista.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">O que entregamos</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {p.resolvidasLista.map((d, i) => (
                <li key={i}>
                  {d.titulo}
                  {d.tema ? <span className="text-slate-400"> · {d.tema}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ valor, label, cor }: { valor: number; label: string; cor: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className={`text-2xl font-semibold tabular-nums ${cor}`}>{valor}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}
