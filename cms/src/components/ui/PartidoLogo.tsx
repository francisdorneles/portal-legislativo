'use client'

export function PartidoLogo({ sigla }: { sigla: string }) {
  return (
    <img
      src={`/partidos/${sigla}.png`}
      alt={sigla}
      className="partido-logo"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
    />
  )
}
