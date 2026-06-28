import { contatosSegmentados } from '@/modules/crm/disparo.queries'
import { dispararSegmentado } from '@/modules/crm/disparo.actions'

const campo = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900'

export default async function DisparoPage({
  searchParams,
}: {
  searchParams: Promise<{ tags?: string; bairro?: string }>
}) {
  const sp = await searchParams
  const tagsStr = sp.tags?.trim() ?? ''
  const bairro = sp.bairro?.trim() ?? ''
  const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean)

  const filtrou = tagsStr !== '' || bairro !== ''
  const alvos = filtrou ? await contatosSegmentados({ tags, bairro: bairro || undefined }) : []

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Disparo segmentado</h1>
      <p className="mb-6 text-sm text-slate-500">Filtre por tag/bairro e dispare uma comunicação para todos.</p>

      {/* filtro (GET) */}
      <form method="get" className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <input name="tags" defaultValue={tagsStr} placeholder="Tags (vírgula)" className={campo} />
        <input name="bairro" defaultValue={bairro} placeholder="Bairro" className={campo} />
        <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100">
          Filtrar
        </button>
      </form>

      {filtrou && (
        <>
          <p className="mb-3 text-sm font-medium text-slate-700">{alvos.length} contato(s) no segmento</p>

          <ul className="mb-6 max-h-48 divide-y divide-slate-200 overflow-auto rounded-xl border border-slate-200 bg-white">
            {alvos.length === 0 && <li className="p-3 text-sm text-slate-500">Nenhum contato casou com o filtro.</li>}
            {alvos.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="text-slate-800">{c.nome}</span>
                <span className="text-slate-400">{[c.bairro, c.tags.join(', ')].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ul>

          {alvos.length > 0 && (
            <form action={dispararSegmentado} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="tags" value={tagsStr} />
              <input type="hidden" name="bairro" value={bairro} />
              <textarea name="mensagem" required rows={3} placeholder="Mensagem do disparo" className={campo} />
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Disparar para {alvos.length} contato(s)
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
