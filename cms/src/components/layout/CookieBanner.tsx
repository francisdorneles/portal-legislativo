'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const CHAVE = 'lgpd-consent-v1'

/** Banner de consentimento LGPD. Some após o aceite (persistido em localStorage). */
export function CookieBanner() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(CHAVE)) setVisivel(true)
    } catch {
      /* sem localStorage: não bloqueia o uso */
    }
  }, [])

  if (!visivel) return null

  const responder = (aceito: boolean) => {
    try {
      localStorage.setItem(CHAVE, aceito ? new Date().toISOString() : 'refused')
    } catch { /* ignora */ }
    setVisivel(false)
  }

  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de privacidade">
      <p>
        Usamos cookies essenciais para o funcionamento do portal e, com sua autorização, cookies de
        analytics (Umami — sem rastreamento pessoal). Saiba mais na nossa{' '}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-am" onClick={() => responder(true)}>
          Aceitar analytics
        </button>
        <button type="button" className="btn" style={{ background: 'transparent', color: 'inherit', border: '1px solid currentColor' }} onClick={() => responder(false)}>
          Só essenciais
        </button>
      </div>
    </div>
  )
}
