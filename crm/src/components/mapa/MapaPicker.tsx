'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { definirLocalDemanda } from '@/modules/crm/demandas.actions'

const CENTRO: [number, number] = [-29.7993, -51.8642] // Taquari/RS

function Clique({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

export function MapaPicker({ demandaId, lat, lng }: { demandaId: string; lat: number | null; lng: number | null }) {
  const [pos, setPos] = useState<[number, number] | null>(lat != null && lng != null ? [lat, lng] : null)
  const salvar = definirLocalDemanda.bind(null, demandaId, pos?.[0] ?? 0, pos?.[1] ?? 0)

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">Clique no mapa para marcar o local da demanda.</p>
      <MapContainer center={pos ?? CENTRO} zoom={13} style={{ height: 280, width: '100%', borderRadius: 8 }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Clique onPick={(la, ln) => setPos([la, ln])} />
        {pos && <CircleMarker center={pos} radius={9} pathOptions={{ color: '#0f172a', fillColor: '#0f172a', fillOpacity: 0.7 }} />}
      </MapContainer>
      {pos && (
        <form action={salvar}>
          <p className="mb-1 text-xs text-slate-500">{pos[0].toFixed(5)}, {pos[1].toFixed(5)}</p>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Salvar local
          </button>
        </form>
      )}
    </div>
  )
}
