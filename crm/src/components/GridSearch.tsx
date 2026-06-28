'use client'

import { useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

/** Busca da grid (ERP): atualiza ?q= na URL com debounce e reseta a página. */
export function GridSearch({ placeholder = 'Buscar…' }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const q = params.get('q') ?? ''
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function aplicar(valor: string) {
    const sp = new URLSearchParams(Array.from(params.entries()))
    if (valor) sp.set('q', valor)
    else sp.delete('q')
    sp.delete('page')
    router.replace(`${pathname}?${sp.toString()}`)
  }

  function onChange(valor: string) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => aplicar(valor), 300)
  }

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        defaultValue={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-input bg-transparent pl-8 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />
      {q && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = ''
            aplicar('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
