'use client'

import dynamic from 'next/dynamic'
import type { DisputaBairroUI } from './MapaDisputa'

const Mapa = dynamic(() => import('./MapaDisputa'), {
  ssr: false,
  loading: () => <div className="h-[70vh] w-full animate-pulse rounded-xl bg-slate-100" />,
})

export default function MapaDisputaClient({ bairros }: { bairros: DisputaBairroUI[] }) {
  return <Mapa bairros={bairros} />
}
