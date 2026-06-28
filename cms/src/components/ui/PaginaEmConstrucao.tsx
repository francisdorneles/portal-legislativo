import Link from 'next/link'

/** Placeholder padrão para rotas ainda não implementadas (evita 404 e dá contexto). */
export function PaginaEmConstrucao({
  titulo,
  descricao,
  fase,
}: {
  titulo: string
  descricao: string
  fase?: string
}) {
  return (
    <>
      <h1>{titulo}</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--cinza)' }}>{descricao}</p>
      <div className="em-breve">
        <strong>Em construção</strong>
        {fase && <span> · previsto para a {fase}</span>}
      </div>
      <p style={{ marginTop: '1.5rem' }}>
        <Link className="btn btn-am" href="/">
          ← Voltar ao início
        </Link>
      </p>
    </>
  )
}
