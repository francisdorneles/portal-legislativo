import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="pagina wrap" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <p style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>404</p>
      <h1 style={{ marginTop: '0.5rem' }}>Página não encontrada</h1>
      <p style={{ color: 'var(--cinza)', maxWidth: 420, margin: '1rem auto' }}>
        O endereço que você acessou não existe ou foi movido.
      </p>
      <Link href="/" className="btn btn-am" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
        Voltar para o início
      </Link>
    </div>
  )
}
