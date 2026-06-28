import { listarDemandasComLocal } from '@/modules/crm/demandas.queries'
import MapaDemandasClient from '@/components/mapa/MapaDemandasClient'

const LEGENDA: { cor: string; label: string }[] = [
  { cor: '#d97706', label: 'Aberta' },
  { cor: '#2563eb', label: 'Em andamento' },
  { cor: '#7c3aed', label: 'Encaminhada' },
  { cor: '#16a34a', label: 'Resolvida' },
]

export default async function MapaPage() {
  const demandas = await listarDemandasComLocal()

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Mapa de demandas</h1>
      <p className="mb-4 text-sm text-slate-500">
        {demandas.length} demanda(s) com localização. Defina a localização na página de cada demanda.
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        {LEGENDA.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: l.cor }} />
            {l.label}
          </span>
        ))}
      </div>

      <MapaDemandasClient demandas={demandas} />
    </div>
  )
}
