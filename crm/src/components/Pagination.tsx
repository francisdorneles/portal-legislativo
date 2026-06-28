import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Rodapé da grid (ERP): "X–Y de N" à esquerda + paginação numerada à direita. */
export function Pagination({
  path,
  page,
  perPage,
  total,
  totalPages,
  q = '',
}: {
  path: string
  page: number
  perPage: number
  total: number
  totalPages: number
  q?: string
}) {
  const inicio = total === 0 ? 0 : (page - 1) * perPage + 1
  const fim = Math.min(page * perPage, total)
  const href = (p: number) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (p > 1) sp.set('page', String(p))
    const s = sp.toString()
    return s ? `${path}?${s}` : path
  }

  const win = 2
  const from = Math.max(1, page - win)
  const to = Math.min(totalPages, page + win)
  const nums: number[] = []
  for (let i = from; i <= to; i++) nums.push(i)

  const cell = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors'

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm tabular-nums text-muted-foreground">
        {inicio}–{fim} de {total}
      </span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} className={`${cell} gap-1 text-muted-foreground hover:bg-muted hover:text-foreground`}>
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Link>
        ) : (
          <span className={`${cell} gap-1 text-muted-foreground/40`}><ChevronLeft className="h-4 w-4" /> Anterior</span>
        )}
        {from > 1 && <span className="px-1 text-muted-foreground">…</span>}
        {nums.map((n) =>
          n === page ? (
            <span key={n} className={`${cell} bg-primary text-primary-foreground tabular-nums`}>{n}</span>
          ) : (
            <Link key={n} href={href(n)} className={`${cell} tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground`}>{n}</Link>
          ),
        )}
        {to < totalPages && <span className="px-1 text-muted-foreground">…</span>}
        {page < totalPages ? (
          <Link href={href(page + 1)} className={`${cell} gap-1 text-muted-foreground hover:bg-muted hover:text-foreground`}>
            Próxima <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={`${cell} gap-1 text-muted-foreground/40`}>Próxima <ChevronRight className="h-4 w-4" /></span>
        )}
      </div>
    </div>
  )
}
