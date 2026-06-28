import Link from 'next/link'
import { mapaDisputaParaPagina } from '@/modules/radar/radar.ui'
import MapaDisputaClient from '@/components/mapa/MapaDisputaClient'

const COR: Record<string, string> = { meu: '#16a34a', disputa: '#d97706', rival: '#dc2626' }
const ROTULO: Record<string, string> = { meu: 'Meu território', disputa: 'Em disputa', rival: 'Do rival' }

export default async function DisputaPage() {
  const { candidatoTse, bairros, resumo } = await mapaDisputaParaPagina()

  return (
    <div className="p-8">
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Mapa de disputa</h1>
        <Link href="/dashboard/radar" className="text-sm text-slate-500 hover:underline">
          ← Radar
        </Link>
      </div>

      {!candidatoTse ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Este gabinete não tem candidato vinculado ao TSE. Defina <code>candidatoTse</code> no
          gabinete para ver o mapa de disputa.
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            Seu desempenho como <strong>{candidatoTse}</strong> × o líder de cada bairro (Vereador
            2024). Onde defender, onde brigar, onde você está fora.
          </p>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <Card cor={COR.meu} titulo="Meu território" valor={resumo.meu} legenda="lidero o bairro" />
            <Card cor={COR.disputa} titulo="Em disputa" valor={resumo.disputa} legenda="no jogo (≥50% do líder)" />
            <Card cor={COR.rival} titulo="Do rival" valor={resumo.rival} legenda="líder me supera com folga" />
          </div>

          <MapaDisputaClient bairros={bairros} />

          <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Por bairro</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Bairro</th>
                  <th className="px-4 py-2 font-medium">Situação</th>
                  <th className="px-4 py-2 text-right font-medium">Meus votos</th>
                  <th className="px-4 py-2 font-medium">Líder no bairro</th>
                  <th className="px-4 py-2 text-right font-medium">Votos do líder</th>
                </tr>
              </thead>
              <tbody>
                {bairros.map((b) => (
                  <tr key={b.unidadeId} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-800">
                      <a href={`/dashboard/radar/${b.unidadeId}`} className="hover:underline">{b.bairro}</a>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: COR[b.classificacao] }}
                      >
                        {ROTULO[b.classificacao]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{b.meusVotos.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {b.classificacao === 'meu' ? '— (você)' : b.liderNome}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-500">{b.liderVotos.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Dado eleitoral público (TSE) sempre agregado. "Disputa" = você tem ≥50% dos votos do
            líder no bairro.
          </p>
        </>
      )}
    </div>
  )
}

function Card({ cor, titulo, valor, legenda }: { cor: string; titulo: string; valor: number; legenda: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: cor }} />
        {titulo}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{valor}</div>
      <div className="text-xs text-slate-400">{legenda}</div>
    </div>
  )
}
