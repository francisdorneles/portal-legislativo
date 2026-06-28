'use client'

import dynamic from 'next/dynamic'

const Picker = dynamic(() => import('./MapaPicker').then((m) => m.MapaPicker), {
  ssr: false,
  loading: () => <div className="h-[280px] w-full animate-pulse rounded-lg bg-slate-100" />,
})

export default function MapaPickerClient(props: { demandaId: string; lat: number | null; lng: number | null }) {
  return <Picker {...props} />
}
