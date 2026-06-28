'use client'

import { MapContainer, TileLayer, CircleMarker, GeoJSON, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export interface DisputaBairroUI {
  unidadeId: string
  bairro: string
  lat: number | null
  lng: number | null
  geojson: unknown | null
  meusVotos: number
  liderNome: string
  liderVotos: number
  totalVotos: number
  classificacao: 'meu' | 'disputa' | 'rival'
}

const CENTRO: [number, number] = [-29.7993, -51.8642]
const COR: Record<DisputaBairroUI['classificacao'], string> = {
  meu: '#16a34a',
  disputa: '#d97706',
  rival: '#dc2626',
}
const ROTULO: Record<DisputaBairroUI['classificacao'], string> = {
  meu: 'Meu território',
  disputa: 'Em disputa',
  rival: 'Do rival',
}

function ehPoligono(g: unknown): boolean {
  const t = (g as any)?.type
  return t === 'Polygon' || t === 'MultiPolygon'
}

function PopupDisputa({ b }: { b: DisputaBairroUI }) {
  return (
    <Popup>
      <strong>{b.bairro}</strong> — {ROTULO[b.classificacao]}
      <br />
      Eu: {b.meusVotos.toLocaleString('pt-BR')} · Líder ({b.liderNome}):{' '}
      {b.liderVotos.toLocaleString('pt-BR')}
      <br />
      <a href={`/dashboard/radar/${b.unidadeId}`}>ver ranking do bairro →</a>
    </Popup>
  )
}

export default function MapaDisputa({ bairros }: { bairros: DisputaBairroUI[] }) {
  const comLocal = bairros.filter((b) => b.lat != null && b.lng != null)
  const centro = comLocal.length ? ([comLocal[0].lat!, comLocal[0].lng!] as [number, number]) : CENTRO

  return (
    <MapContainer center={centro} zoom={12} style={{ height: '70vh', width: '100%', borderRadius: 12 }}>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {bairros.map((b) => {
        const c = COR[b.classificacao]
        if (ehPoligono(b.geojson)) {
          return (
            <GeoJSON key={b.unidadeId} data={b.geojson as never} style={{ color: c, weight: 1.5, fillColor: c, fillOpacity: 0.5 }}>
              <PopupDisputa b={b} />
            </GeoJSON>
          )
        }
        if (b.lat != null && b.lng != null) {
          return (
            <CircleMarker key={b.unidadeId} center={[b.lat, b.lng]} radius={12} pathOptions={{ color: c, fillColor: c, fillOpacity: 0.55, weight: 1.5 }}>
              <PopupDisputa b={b} />
            </CircleMarker>
          )
        }
        return null
      })}
    </MapContainer>
  )
}
