'use client'

import { useEffect, useState } from 'react'

const FONTES = ['normal', 'g', 'gg'] as const
type Fonte = (typeof FONTES)[number]

/**
 * Controles de acessibilidade (eMAG/LBI): alto contraste e tamanho de fonte.
 * Aplica classes/data no <html> e persiste a escolha em localStorage.
 */
export function AcessibilidadeControls() {
  const [contraste, setContraste] = useState(false)
  const [fonte, setFonte] = useState<Fonte>('normal')

  // Restaura preferências salvas.
  useEffect(() => {
    try {
      setContraste(localStorage.getItem('a11y-contraste') === '1')
      const f = localStorage.getItem('a11y-fonte') as Fonte | null
      if (f && FONTES.includes(f)) setFonte(f)
    } catch {
      /* sem localStorage */
    }
  }, [])

  // Aplica no documento + persiste.
  useEffect(() => {
    const el = document.documentElement
    el.dataset.contraste = contraste ? '1' : ''
    el.dataset.fonte = fonte
    try {
      localStorage.setItem('a11y-contraste', contraste ? '1' : '0')
      localStorage.setItem('a11y-fonte', fonte)
    } catch {
      /* ignora */
    }
  }, [contraste, fonte])

  const maior = () => setFonte((f) => FONTES[Math.min(FONTES.indexOf(f) + 1, FONTES.length - 1)])
  const menor = () => setFonte((f) => FONTES[Math.max(FONTES.indexOf(f) - 1, 0)])

  return (
    <span className="a11y" role="group" aria-label="Acessibilidade">
      <button type="button" onClick={menor} aria-label="Diminuir fonte">A-</button>
      <button type="button" onClick={maior} aria-label="Aumentar fonte">A+</button>
      <button
        type="button"
        onClick={() => setContraste((c) => !c)}
        aria-pressed={contraste}
        aria-label="Alternar alto contraste"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18V4a8 8 0 0 1 0 16z"/>
        </svg>
      </button>
    </span>
  )
}
