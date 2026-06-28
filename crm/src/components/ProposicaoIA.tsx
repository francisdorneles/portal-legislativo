'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Copy, Check, RefreshCw } from 'lucide-react'
import { gerarProposicao } from '@/modules/ia/proposicao.actions'

/** Botão + área de minuta: a IA redige uma Indicação/Requerimento a partir da demanda. */
export function ProposicaoIA({ demandaId }: { demandaId: string }) {
  const [texto, setTexto] = useState<string | null>(null)
  const [erro, setErro] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [pending, start] = useTransition()

  function gerar() {
    setErro(false)
    start(async () => {
      try {
        const r = await gerarProposicao(demandaId)
        setTexto(r.texto)
      } catch {
        setErro(true)
      }
    })
  }

  async function copiar() {
    if (!texto) return
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {}
  }

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="size-4 text-blue-600" /> Proposição (IA)
        </h2>
        {texto == null ? (
          <button onClick={gerar} disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition active:scale-95 disabled:opacity-50">
            <Sparkles className="size-4" /> {pending ? 'Redigindo…' : 'Gerar minuta'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={gerar} disabled={pending} title="Refazer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50">
              <RefreshCw className="size-4" /> Refazer
            </button>
            <button onClick={copiar} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground hover:bg-muted">
              {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </div>

      {erro && <p className="mt-3 text-sm text-destructive">⚠️ Falha ao gerar. Verifique o provedor de IA (OpenAI/Ollama).</p>}

      {texto != null && (
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={14}
          className="mt-3 w-full resize-y whitespace-pre-wrap rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
      )}
      {texto == null && !pending && !erro && (
        <p className="mt-2 text-pretty text-xs text-muted-foreground">
          A IA transforma esta demanda numa minuta de Indicação/Requerimento pronta pra revisar e protocolar.
        </p>
      )}
    </div>
  )
}
