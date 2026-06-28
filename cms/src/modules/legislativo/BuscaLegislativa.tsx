'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Abas de busca — cada uma aponta para a rota do seu domínio. */
const ABAS = [
  { key: 'projetos', label: 'Projetos', rota: '/processo-legislativo', placeholder: 'Buscar projetos de lei por número, autor ou assunto…' },
  { key: 'legislacao', label: 'Legislação', rota: '/legislacao', placeholder: 'Buscar em leis e normas municipais…' },
  { key: 'vereadores', label: 'Vereadores', rota: '/vereadores', placeholder: 'Buscar vereador por nome ou partido…' },
  { key: 'comissoes', label: 'Comissões', rota: '/comissoes', placeholder: 'Buscar comissão…' },
] as const

export function BuscaLegislativa() {
  const router = useRouter()
  const [ativa, setAtiva] = useState<(typeof ABAS)[number]['key']>('projetos')
  const [termo, setTermo] = useState('')

  const aba = ABAS.find((a) => a.key === ativa)!

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    const q = termo.trim()
    router.push(q ? `${aba.rota}?q=${encodeURIComponent(q)}` : aba.rota)
  }

  return (
    <section className="busca-leg" aria-label="Busca legislativa">
      <div className="wrap">
        <div className="busca-card">
          <h2>O que você procura na Câmara?</h2>
          <div className="busca-abas" role="tablist" aria-label="Tipo de busca">
            {ABAS.map((a) => (
              <button
                key={a.key}
                role="tab"
                type="button"
                aria-selected={a.key === ativa}
                className={a.key === ativa ? 'on' : ''}
                onClick={() => setAtiva(a.key)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <form className="busca-form" onSubmit={buscar} role="search">
            <label htmlFor="busca-input" className="sr-only">
              {aba.placeholder}
            </label>
            <input
              id="busca-input"
              type="search"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder={aba.placeholder}
            />
            <button type="submit" className="btn btn-am">
              Buscar
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
