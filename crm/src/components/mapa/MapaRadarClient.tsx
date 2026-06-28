'use client'

import dynamic from 'next/dynamic'
import type { BairroRadar } from './MapaRadar'

// ssr:false só é permitido em client component — Leaflet acessa window.
const Mapa = dynamic(() => import('./MapaRadar'), {
  ssr: false,
  loading: () => <div className="h-[70vh] w-full animate-pulse rounded-xl bg-slate-100" />,
})

export default function MapaRadarClient({ bairros }: { bairros: BairroRadar[] }) {
  return <Mapa bairros={bairros} />
}
