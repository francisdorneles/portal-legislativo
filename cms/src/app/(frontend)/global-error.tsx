'use client'

import { useEffect } from 'react'

// Captura erros no layout raiz (ex.: falha no SiteHeader, fontes, providers).
// Não tem acesso ao layout — precisa recriar html/body.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[portal:global]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem 1rem', background: '#f5f5f5' }}>
        <h1 style={{ color: '#0a1f44' }}>Erro inesperado</h1>
        <p style={{ color: '#555', maxWidth: 400, margin: '1rem auto' }}>
          O portal encontrou um problema crítico. Por favor, tente recarregar a página.
        </p>
        <button
          onClick={reset}
          style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#f5b800', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
        >
          Recarregar
        </button>
        {error.digest && (
          <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#999' }}>Código: {error.digest}</p>
        )}
      </body>
    </html>
  )
}
