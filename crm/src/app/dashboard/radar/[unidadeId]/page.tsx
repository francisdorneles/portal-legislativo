import Link from 'next/link'
import { notFound } from 'next/navigation'
import { bairroDetalhe } from '@/modules/radar/radar.ui'

export default async function BairroPage({
  params,
}: {
  params: Promise<{ unidadeId: string }>
}) {
  const { unidadeId } = await params
  const detalhe = await bairroDetalhe(unidadeId)
  if (!detalhe) notFound()

  const max = detalhe.candidatos[0]?.votos ?? 1

  return (
    <div className="p-8">
      <Link href="/dashboard/radar" className="text-sm text-slate-500 hover:underline">
        ← Radar
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold text-slate-900">{detalhe.bairro}</h1>
      <p className="mb-6 text-sm text-slate-500">
        {detalhe.votos.toLocaleString('pt-BR')} votos para Vereador (2024) ·{' '}
        {detalhe.candidatos.length} candidato(s) com voto aqui
      </p>

      <h2 className="mb-2 text-lg font-semibold text-slate-900">Ranking de candidatos no bairro</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Candidato</th>
              <th className="px-4 py-2 text-right font-medium">Votos</th>
              <th className="px-4 py-2 font-medium">Peso no bairro</th>
            </tr>
          </thead>
          <tbody>
            {detalhe.candidatos.map((c, i) => (
              <tr key={c.candidatoNome} className="border-t border-slate-100">
                <td className="px-4 py-2 tabular-nums text-slate-400">{i + 1}</td>
                <td className="px-4 py-2 text-slate-800">{c.candidatoNome}</td>
                <td className="px-4 py-2 text-right tabular-nums">{c.votos.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-2">
                  <div className="h-2 w-full max-w-[180px] rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-800"
                      style={{ width: `${Math.max(3, (c.votos / max) * 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Dado eleitoral sempre agregado (LGPD). Votos do bairro = soma dos locais de votação
        vinculados a ele na tabela curada.
      </p>
    </div>
  )
}
