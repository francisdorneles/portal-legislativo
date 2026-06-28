'use client'

import { useState } from 'react'

/** Botões de compartilhar a prestação de contas: copiar, WhatsApp e imprimir. */
export function PrestacaoAcoes({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // clipboard pode falhar sem https/permite — ignora silenciosamente
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(texto)}`

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        onClick={copiar}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        {copiado ? '✓ Copiado' : 'Copiar texto'}
      </button>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Enviar no WhatsApp
      </a>
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Imprimir / PDF
      </button>
    </div>
  )
}
