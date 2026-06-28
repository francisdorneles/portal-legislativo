'use client'

import { useEffect, useState } from 'react'

/**
 * Carrossel de fotos da agenda (galeria do Payload). Rotaciona
 * automaticamente; dots para navegar. Sem fotos, mostra só o fundo neutro.
 */
export function AgendaFotos({ fotos }: { fotos: string[] }) {
  const [ativo, setAtivo] = useState(0)
  const total = fotos.length

  useEffect(() => {
    if (total <= 1) return
    const t = setInterval(() => setAtivo((a) => (a + 1) % total), 5000)
    return () => clearInterval(t)
  }, [total])

  return (
    <div className="ag-fotos">
      {fotos.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={src} alt="" aria-hidden="true" className={i === ativo ? 'is-ativo' : ''} />
      ))}
      {total > 1 && (
        <div className="ag-fotos__dots">
          {fotos.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === ativo ? 'on' : ''}
              onClick={() => setAtivo(i)}
              aria-label={`Foto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
