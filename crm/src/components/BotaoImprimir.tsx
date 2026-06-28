'use client'

export function BotaoImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 print:hidden"
    >
      Imprimir / Salvar PDF
    </button>
  )
}
