import { listarComunicacoes } from '@/modules/crm/comunicacoes.queries'

const TIPO_LABEL: Record<string, string> = {
  demanda_resolvida: 'Demanda resolvida',
  aniversario: 'Aniversário',
  boletim: 'Boletim',
}

function dataBR(d: Date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d)
}

export default async function ComunicacoesPage() {
  const comunicacoes = await listarComunicacoes()

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Prova de trabalho</h1>
      <p className="mb-6 text-sm text-slate-500">
        Registro de comunicações ao cidadão · {comunicacoes.length} no total
      </p>

      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {comunicacoes.length === 0 && (
          <li className="p-4 text-sm text-slate-500">
            Nenhuma comunicação ainda. Resolva uma demanda com cidadão vinculado para gerar a primeira.
          </li>
        )}
        {comunicacoes.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="font-medium text-slate-800">{c.cidadao.nome}</p>
              <p className="text-sm text-slate-600">{c.conteudo}</p>
              <p className="text-xs text-slate-400">{dataBR(c.createdAt)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {TIPO_LABEL[c.tipo] ?? c.tipo} · {c.canal}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.enviadaEm ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {c.enviadaEm ? 'Entregue' : 'Na fila'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
