import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { buscarDocumento } from '@/modules/crm/documentos.queries'
import { BotaoImprimir } from '@/components/BotaoImprimir'

function dataBR(d: Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(d)
}

export default async function DocumentoView({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const doc = await buscarDocumento(id)
  if (!doc) notFound()

  return (
    <div className="p-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/dashboard/documentos" className="text-sm text-slate-500 hover:underline">
          ← documentos
        </Link>
        <BotaoImprimir />
      </div>

      {/* folha imprimível */}
      <article className="mx-auto max-w-[21cm] rounded-xl border border-slate-200 bg-white p-12 leading-relaxed text-slate-900 shadow-sm print:border-0 print:shadow-none">
        <header className="mb-8 border-b border-slate-300 pb-4 text-center">
          <p className="font-semibold">Câmara Municipal de Taquari</p>
          <p className="text-sm text-slate-500">{session.user.name}</p>
        </header>

        <p className="mb-6 text-sm text-slate-500">
          {doc.tipo}{doc.numero ? ` nº ${doc.numero}` : ''} — {dataBR(doc.createdAt)}
        </p>
        {doc.destinatario && <p className="mb-6">Ao(À) {doc.destinatario},</p>}

        <div className="whitespace-pre-wrap">{doc.conteudo}</div>

        <footer className="mt-16 text-center">
          <p className="border-t border-slate-400 pt-2 inline-block px-8">{session.user.name}</p>
        </footer>
      </article>
    </div>
  )
}
