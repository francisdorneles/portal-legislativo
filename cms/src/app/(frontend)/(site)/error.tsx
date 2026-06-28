'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[portal]', error)
  }, [error])

  return (
    <div className="pagina wrap" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <p style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--navy)', lineHeight: 1 }}>!</p>
      <h1 style={{ marginTop: '0.5rem' }}>Algo deu errado</h1>
      <p style={{ color: 'var(--cinza)', maxWidth: 420, margin: '1rem auto' }}>
        Ocorreu um erro ao carregar esta página. Tente novamente ou volte para o início.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-am" onClick={reset}>
          Tentar novamente
        </button>
        <Link href="/" className="btn" style={{ background: 'var(--navy)', color: '#fff' }}>
          Início
        </Link>
      </div>
      {error.digest && (
        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--cinza)' }}>
          Código: {error.digest}
        </p>
      )}
    </div>
  )
}
