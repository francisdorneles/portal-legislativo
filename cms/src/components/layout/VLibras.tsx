'use client'

import { useEffect } from 'react'

/**
 * Widget VLibras (tradução para Libras) usando o plugin oficial do gov.br — a
 * MESMA abordagem do SAPL (que funciona). Diferença crucial: o markup do VLibras
 * é injetado FORA do React (via DOM direto no <body>), porque o plugin MUTA esse
 * subtree (injeta o avatar/painel) e o React, se for dono da árvore, briga com
 * essas mutações e quebra o painel. Por isso renderizamos via useEffect/DOM, não
 * como JSX. Não usar o pacote npm `@sgd/vlibras*` (build quebrado — ver docs/07).
 */
const PLUGIN_URL = 'https://vlibras.gov.br/app/vlibras-plugin.js'
const APP_URL = 'https://vlibras.gov.br/app'

export function VLibras() {
  useEffect(() => {
    // Evita duplicar se o componente remontar.
    if (document.querySelector('[vw]')) return

    const container = document.createElement('div')
    container.setAttribute('vw', '')
    container.className = 'enabled'
    container.setAttribute('aria-hidden', 'true')
    container.innerHTML =
      '<div vw-access-button class="active"></div>' +
      '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>'
    document.body.appendChild(container)

    const script = document.createElement('script')
    script.src = PLUGIN_URL
    script.async = true
    script.onload = () => {
      const w = window as unknown as {
        VLibras?: { Widget: new (url: string) => void }
        onload?: (() => void) | null
      }
      if (!w.VLibras) return
      new w.VLibras.Widget(APP_URL)
      // O plugin monta o botão/assets dentro de um handler que ele coloca em
      // `window.onload`. Como injetamos via useEffect (o evento load JÁ disparou),
      // esse handler nunca rodaria — então o disparamos manualmente. (Causa-raiz
      // verificada na fonte do plugin: `window.onload = () => {...mount...}`.)
      if (typeof w.onload === 'function') w.onload()
    }
    document.body.appendChild(script)

    return () => {
      container.remove()
      script.remove()
    }
  }, [])

  return null
}
