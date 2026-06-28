'use client'

import { MapContainer, TileLayer, CircleMarker, GeoJSON, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export interface BairroRadar {
  unidadeId: string
  bairro: string
  lat: number | null
  lng: number | null
  geojson: unknown | null
  votos: number
  demandas: number
}

// Centro padrão: Taquari/RS
const CENTRO: [number, number] = [-29.7993, -51.8642]

function raio(votos: number, maxVotos: number): number {
  if (maxVotos <= 0) return 8
  return 8 + Math.sqrt(votos / maxVotos) * 22
}

/** Cor pela densidade de demandas: cinza (0) → âmbar → vermelho (muitas). */
function cor(demandas: number, maxDemandas: number): string {
  if (demandas === 0) return '#94a3b8'
  const t = maxDemandas > 0 ? demandas / maxDemandas : 0
  return t > 0.66 ? '#dc2626' : t > 0.33 ? '#ea580c' : '#d97706'
}

/** Opacidade do preenchimento pela densidade de votos (mais votos = mais sólido). */
function opacidade(votos: number, maxVotos: number): number {
  return 0.15 + (maxVotos > 0 ? votos / maxVotos : 0) * 0.5
}

function ehPoligono(g: unknown): boolean {
  const t = (g as any)?.type
  return t === 'Polygon' || t === 'MultiPolygon'
}

function PopupBairro({ b }: { b: BairroRadar }) {
  return (
    <Popup>
      <strong>{b.bairro}</strong>
      <br />
      {b.votos.toLocaleString('pt-BR')} votos · {b.demandas} demanda(s)
      <br />
      <a href={`/dashboard/radar/${b.unidadeId}`}>ver candidatos no bairro →</a>
    </Popup>
  )
}

export default function MapaRadar({ bairros }: { bairros: BairroRadar[] }) {
  const maxVotos = Math.max(1, ...bairros.map((b) => b.votos))
  const maxDemandas = Math.max(1, ...bairros.map((b) => b.demandas))
  const comLocal = bairros.filter((b) => b.lat != null && b.lng != null)
  const centro = comLocal.length ? ([comLocal[0].lat!, comLocal[0].lng!] as [number, number]) : CENTRO

  return (
    <MapContainer center={centro} zoom={12} style={{ height: '70vh', width: '100%', borderRadius: 12 }}>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {bairros.map((b) => {
        const c = cor(b.demandas, maxDemandas)
        if (ehPoligono(b.geojson)) {
          return (
            <GeoJSON
              key={b.unidadeId}
              data={b.geojson as never}
              style={{ color: c, weight: 1.5, fillColor: c, fillOpacity: opacidade(b.votos, maxVotos) }}
            >
              <PopupBairro b={b} />
            </GeoJSON>
          )
        }
        if (b.lat != null && b.lng != null) {
          return (
            <CircleMarker
              key={b.unidadeId}
              center={[b.lat, b.lng]}
              radius={raio(b.votos, maxVotos)}
              pathOptions={{ color: c, fillColor: c, fillOpacity: 0.55, weight: 1.5 }}
            >
              <PopupBairro b={b} />
            </CircleMarker>
          )
        }
        return null
      })}
    </MapContainer>
  )
}
