'use client'

import dynamic from 'next/dynamic'
import type { DemandaLocal } from './MapaDemandas'

// ssr:false só é permitido em client component — Leaflet acessa window.
const Mapa = dynamic(() => import('./MapaDemandas'), {
  ssr: false,
  loading: () => <div className="h-[70vh] w-full animate-pulse rounded-xl bg-slate-100" />,
})

export default function MapaDemandasClient({ demandas }: { demandas: DemandaLocal[] }) {
  return <Mapa demandas={demandas} />
}
