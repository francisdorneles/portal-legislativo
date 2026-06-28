'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const CHAVE_CONSENT = 'lgpd-consent-v1'

/**
 * Injeta o script do Umami apenas após consentimento LGPD.
 * Umami é cookieless por padrão — não rastreia PII, sem necessidade de opt-in técnico.
 * O gate aqui é por boa prática com o CookieBanner existente.
 *
 * Configurar em .env:
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID=<id do site no Umami>
 *   NEXT_PUBLIC_UMAMI_SRC=https://analytics.seu-dominio.com/script.js
 */
export function UmamiAnalytics() {
  const [consentido, setConsentido] = useState(false)

  useEffect(() => {
    const verificar = () => {
      try {
        const val = localStorage.getItem(CHAVE_CONSENT)
        // Só carrega se o valor for uma data ISO (aceito) — 'refused' ou null = não carrega
        setConsentido(!!val && val !== 'refused')
      } catch { /* sem localStorage */ }
    }
    verificar()
    // Ouve o aceite do CookieBanner na mesma aba
    window.addEventListener('storage', verificar)
    return () => window.removeEventListener('storage', verificar)
  }, [])

  const src = process.env.NEXT_PUBLIC_UMAMI_SRC
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  if (!consentido || !src || !websiteId) return null

  return (
    <Script
      src={src}
      data-website-id={websiteId}
      strategy="afterInteractive"
      data-auto-track="true"
      data-do-not-track="true"
    />
  )
}
