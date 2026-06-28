'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PainelEstado } from '@/modules/legislativo/painel.queries'

const INTERVALO_MS = 8000

/**
 * Painel eletrônico ao vivo: faz polling no proxy /api/painel (que fala com o
 * SAPL no servidor) e reflete o estado da sessão em andamento. Recebe um estado
 * inicial do servidor (SSR) para o primeiro paint não ficar vazio.
 */
export function PainelLive({ inicial }: { inicial: PainelEstado }) {
  const [estado, setEstado] = useState<PainelEstado>(inicial)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let ativo = true
    async function buscar() {
      try {
        const r = await fetch('/api/painel', { cache: 'no-store' })
        if (!r.ok) throw new Error()
        const dados = (await r.json()) as PainelEstado
        if (ativo) {
          setEstado(dados)
          setErro(false)
        }
      } catch {
        if (ativo) setErro(true)
      }
    }
    const t = setInterval(buscar, INTERVALO_MS)
    return () => {
      ativo = false
      clearInterval(t)
    }
  }, [])

  if (!estado.aoVivo) {
    return (
      <div className="painel-vazio">
        <span className="painel-status painel-status--off">Sem sessão ao vivo</span>
        <p>Nenhuma sessão plenária em andamento no momento.</p>
        <p className="painel-vazio-dica">
          Consulte a <Link href="/sessoes">agenda de sessões</Link> para a próxima data.
        </p>
      </div>
    )
  }

  const s = estado.sessao!
  const hora = new Date(estado.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="painel-live">
      <div className="painel-cabecalho">
        <span className="painel-status painel-status--on">
          <span className="painel-pulso" aria-hidden /> AO VIVO
        </span>
        <span className="painel-atualizado">
          Atualizado às {hora}
          {erro && ' · reconectando…'}
        </span>
      </div>

      <h2 className="painel-sessao">
        {s.numero}ª {s.tipoNome}
      </h2>

      <div className="painel-grid">
        <div className="painel-card">
          <span className="painel-card-rotulo">Em apreciação</span>
          {estado.itemAtual ? (
            <Link className="painel-materia" href={`/processo-legislativo/${estado.itemAtual.materiaId}`}>
              {estado.itemAtual.titulo}
            </Link>
          ) : (
            <span className="painel-materia">Nenhum item em votação</span>
          )}
          {estado.itemAtual?.ementa && <p className="painel-ementa">{estado.itemAtual.ementa}</p>}
        </div>

        <div className="painel-numeros">
          <div className="painel-num">
            <strong>{estado.presentes ?? '—'}</strong>
            <span>Presentes</span>
          </div>
          <div className="painel-num">
            <strong>
              {estado.itensConcluidos ?? 0}/{estado.totalItens ?? 0}
            </strong>
            <span>Itens da pauta</span>
          </div>
        </div>
      </div>
    </div>
  )
}
