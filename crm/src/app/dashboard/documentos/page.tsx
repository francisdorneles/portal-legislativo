import Link from 'next/link'
import { listarDocumentos } from '@/modules/crm/documentos.queries'
import { criarDocumento, malaDireta } from '@/modules/crm/documentos.actions'

const campo = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900'

function dataBR(d: Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d)
}

export default async function DocumentosPage() {
  const docs = await listarDocumentos()

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Documentos do gabinete</h1>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* documento avulso */}
        <form action={criarDocumento} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">Novo documento</h2>
          <div className="grid grid-cols-2 gap-3">
            <input name="tipo" placeholder="Tipo (ofício…)" defaultValue="ofício" className={campo} />
            <input name="numero" placeholder="Número" className={campo} />
          </div>
          <input name="destinatario" placeholder="Destinatário" className={campo} />
          <textarea name="conteudo" required rows={4} placeholder="Conteúdo" className={campo} />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Criar
          </button>
        </form>

        {/* mala direta */}
        <form action={malaDireta} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">Mala direta (1 por contato do segmento)</h2>
          <div className="grid grid-cols-2 gap-3">
            <input name="tipo" placeholder="Tipo (carta…)" defaultValue="carta" className={campo} />
            <input name="tags" placeholder="Tags (vírgula)" className={campo} />
          </div>
          <input name="bairro" placeholder="Bairro (opcional)" className={campo} />
          <textarea name="conteudo" required rows={4} placeholder="Modelo — use {nome} para o nome do contato" className={campo} />
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100">
            Gerar documentos
          </button>
        </form>
      </div>

      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {docs.length === 0 && <li className="p-4 text-sm text-slate-500">Nenhum documento.</li>}
        {docs.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">
                {d.tipo}{d.numero ? ` nº ${d.numero}` : ''}{d.destinatario ? ` · ${d.destinatario}` : ''}
              </p>
              <p className="text-xs text-slate-400">{dataBR(d.createdAt)} · {d.status}</p>
            </div>
            <Link href={`/dashboard/documentos/${d.id}`} className="shrink-0 text-sm text-slate-600 hover:underline">
              Abrir / imprimir
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
