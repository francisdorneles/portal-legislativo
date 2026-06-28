'use client'

import { useState, type ReactNode } from 'react'

export type PerfilTab = {
  id: string
  label: string
  /** Contador exibido ao lado do label (ex: 12 projetos). Omitir se não tiver. */
  badge?: number
  conteudo: ReactNode
}

/**
 * Tabs do perfil do vereador. Server passa conteúdo já renderizado por aba;
 * client só alterna qual está visível. Sem roteamento — estado local.
 */
export function PerfilTabs({ tabs, padrao }: { tabs: PerfilTab[]; padrao?: string }) {
  const [ativa, setAtiva] = useState(padrao ?? tabs[0]?.id)
  const tabAtiva = tabs.find((t) => t.id === ativa) ?? tabs[0]

  return (
    <>
      <nav className="perfil-tabs" role="tablist" aria-label="Seções do vereador">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={t.id === ativa}
            aria-controls={`painel-${t.id}`}
            className={`perfil-tab${t.id === ativa ? ' on' : ''}`}
            onClick={() => setAtiva(t.id)}
          >
            {t.label}
            {typeof t.badge === 'number' && (
              <span className="perfil-tab-badge">·{t.badge}</span>
            )}
          </button>
        ))}
      </nav>
      <div
        role="tabpanel"
        id={`painel-${tabAtiva.id}`}
        aria-labelledby={`tab-${tabAtiva.id}`}
        className="perfil-tab-conteudo"
      >
        {tabAtiva.conteudo}
      </div>
    </>
  )
}
