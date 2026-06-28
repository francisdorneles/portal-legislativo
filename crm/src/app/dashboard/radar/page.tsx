import { radarParaPagina } from '@/modules/radar/radar.ui'
import MapaRadarClient from '@/components/mapa/MapaRadarClient'

export default async function RadarPage() {
  const { bairros, totalVotos, totalDemandas, secoes, oportunidades } = await radarParaPagina()
  const semDados = bairros.length === 0

  return (
    <div className="p-8">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Radar do mandato</h1>
        <a
          href="/dashboard/radar/disputa"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          ⚔️ Mapa de disputa
        </a>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Cruzamento <strong>voto × demanda</strong> por bairro (Vereador 2024). Tamanho do círculo =
        votos; cor = densidade de demandas do seu gabinete.
      </p>

      {semDados ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Nenhum dado eleitoral importado ainda. Rode <code>pnpm radar:importar</code> e{' '}
          <code>pnpm radar:agregar</code>.
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card titulo="Bairros" valor={bairros.length} />
            <Card titulo="Votos (Vereador)" valor={totalVotos.toLocaleString('pt-BR')} />
            <Card titulo="Demandas no mapa" valor={totalDemandas} />
            <Card titulo="Seções" valor={secoes} />
          </div>

          {oportunidades.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                🎯 Oportunidades — muito voto, pouca demanda
              </div>
              <p className="mb-3 text-xs text-amber-800">
                Bairros onde você tem base eleitoral mas poucas demandas registradas. Candidatos a
                presença/escuta ativa.
              </p>
              <div className="flex flex-wrap gap-2">
                {oportunidades.map((b) => (
                  <span
                    key={b.unidadeId}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm text-amber-900"
                  >
                    <strong>{b.bairro}</strong> · {b.votos.toLocaleString('pt-BR')} votos ·{' '}
                    {b.demandas} demanda(s)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-3 text-sm text-slate-600">
            <Legenda cor="#94a3b8" label="0 demandas" />
            <Legenda cor="#d97706" label="poucas" />
            <Legenda cor="#ea580c" label="médias" />
            <Legenda cor="#dc2626" label="muitas" />
          </div>

          <MapaRadarClient bairros={bairros} />

          <h2 className="mt-8 mb-2 text-lg font-semibold text-slate-900">Ranking por bairro</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Bairro</th>
                  <th className="px-4 py-2 text-right font-medium">Votos</th>
                  <th className="px-4 py-2 text-right font-medium">Demandas</th>
                  <th className="px-4 py-2 text-right font-medium">Votos / demanda</th>
                </tr>
              </thead>
              <tbody>
                {bairros.map((b) => (
                  <tr key={b.unidadeId} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-800">
                      <a href={`/dashboard/radar/${b.unidadeId}`} className="hover:underline">
                        {b.bairro}
                      </a>
                      {b.lat == null && (
                        <span className="ml-2 text-xs text-slate-400">(sem coordenada)</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{b.votos.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{b.demandas}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                      {b.demandas > 0 ? Math.round(b.votos / b.demandas).toLocaleString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Bairros vêm da tabela curada de locais de votação (algumas entradas com baixa confiança).
            Demandas casam pelo nome do bairro (texto livre). Dado eleitoral sempre agregado (LGPD).
          </p>
        </>
      )}
    </div>
  )
}

function Card({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{titulo}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{valor}</div>
    </div>
  )
}

function Legenda({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: cor }} />
      {label}
    </span>
  )
}
