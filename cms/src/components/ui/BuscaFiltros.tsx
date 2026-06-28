/**
 * Barra de busca padrão das listas: texto livre + período (de/até).
 * Formulário GET (funciona sem JS) que envia para `basePath`. Os filtros de
 * tipo (chips/badges) ficam fora deste componente, mas seus valores são
 * preservados aqui via inputs ocultos (`preservar`).
 */
interface Props {
  basePath: string
  q?: string
  de?: string
  ate?: string
  /** Placeholder do campo de texto (varia por domínio). Vazio = sem campo de texto. */
  placeholderTexto?: string
  /** Parâmetros a manter ao submeter (ex.: { tipo: "3" }). */
  preservar?: Record<string, string | undefined>
}

export function BuscaFiltros({ basePath, q, de, ate, placeholderTexto = 'Buscar…', preservar = {} }: Props) {
  return (
    <form action={basePath} role="search" className="busca-filtros">
      {Object.entries(preservar).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}

      {placeholderTexto && (
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder={placeholderTexto}
          aria-label="Buscar por texto"
          className="bf-texto"
        />
      )}

      <input
        type="date"
        name="de"
        defaultValue={de ?? ''}
        aria-label="Data inicial"
        title="Data inicial"
        className="bf-data"
      />
      <input
        type="date"
        name="ate"
        defaultValue={ate ?? ''}
        aria-label="Data final"
        title="Data final"
        className="bf-data"
      />

      <button type="submit" className="btn btn-am">Buscar</button>
    </form>
  )
}
