import Link from 'next/link'

/** Janela de páginas ao redor da atual (ex.: 1 … 4 5 [6] 7 8 … 20). */
function janela(page: number, totalPaginas: number, raio = 2): (number | '…')[] {
  const paginas: (number | '…')[] = []
  const inicio = Math.max(1, page - raio)
  const fim = Math.min(totalPaginas, page + raio)
  if (inicio > 1) {
    paginas.push(1)
    if (inicio > 2) paginas.push('…')
  }
  for (let p = inicio; p <= fim; p++) paginas.push(p)
  if (fim < totalPaginas) {
    if (fim < totalPaginas - 1) paginas.push('…')
    paginas.push(totalPaginas)
  }
  return paginas
}

interface Props {
  page: number
  total: number
  porPagina?: number
  /** Caminho base sem query (ex.: "/processo-legislativo"). */
  basePath: string
  /** Demais parâmetros a preservar na URL (ex.: { tipo: "3" }). */
  params?: Record<string, string | undefined>
}

/**
 * Controle de paginação data-driven. Gera links GET (funciona sem JS),
 * preservando os demais parâmetros da query. Não renderiza nada quando há
 * só uma página. Tamanho de página padrão = 10 (o do SAPL).
 */
export function Paginacao({ page, total, porPagina = 10, basePath, params = {} }: Props) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  if (totalPaginas <= 1) return null

  const href = (p: number) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v)
    }
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  return (
    <nav className="paginacao" role="navigation" aria-label="Paginação">
      {page > 1 ? (
        <Link className="pag-seta" href={href(page - 1)} rel="prev" aria-label="Página anterior">
          ‹ Anterior
        </Link>
      ) : (
        <span className="pag-seta pag-off" aria-disabled="true">‹ Anterior</span>
      )}

      <ul className="pag-nums">
        {janela(page, totalPaginas).map((p, i) =>
          p === '…' ? (
            <li key={`e${i}`} className="pag-elip" aria-hidden="true">…</li>
          ) : (
            <li key={p}>
              {p === page ? (
                <span className="pag-num on" aria-current="page">{p}</span>
              ) : (
                <Link className="pag-num" href={href(p)}>{p}</Link>
              )}
            </li>
          ),
        )}
      </ul>

      {page < totalPaginas ? (
        <Link className="pag-seta" href={href(page + 1)} rel="next" aria-label="Próxima página">
          Próxima ›
        </Link>
      ) : (
        <span className="pag-seta pag-off" aria-disabled="true">Próxima ›</span>
      )}
    </nav>
  )
}
