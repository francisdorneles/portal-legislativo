'use client'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export interface DemandaLocal {
  id: string
  titulo: string
  status: string
  lat: number | null
  lng: number | null
  bairro?: string | null
}

const COR: Record<string, string> = {
  ABERTA: '#d97706',
  EM_ANDAMENTO: '#2563eb',
  ENCAMINHADA: '#7c3aed',
  RESOLVIDA: '#16a34a',
}
const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  ENCAMINHADA: 'Encaminhada',
  RESOLVIDA: 'Resolvida',
}

// Centro padrão: Taquari/RS
const CENTRO: [number, number] = [-29.7993, -51.8642]

export default function MapaDemandas({ demandas }: { demandas: DemandaLocal[] }) {
  const comLocal = demandas.filter((d) => d.lat != null && d.lng != null)
  const centro = comLocal.length ? ([comLocal[0].lat!, comLocal[0].lng!] as [number, number]) : CENTRO

  return (
    <MapContainer center={centro} zoom={13} style={{ height: '70vh', width: '100%', borderRadius: 12 }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {comLocal.map((d) => (
        <CircleMarker
          key={d.id}
          center={[d.lat!, d.lng!]}
          radius={9}
          pathOptions={{ color: COR[d.status] ?? '#64748b', fillColor: COR[d.status] ?? '#64748b', fillOpacity: 0.7 }}
        >
          <Popup>
            <strong>{d.titulo}</strong>
            <br />
            {STATUS_LABEL[d.status] ?? d.status}
            {d.bairro ? ` · ${d.bairro}` : ''}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
