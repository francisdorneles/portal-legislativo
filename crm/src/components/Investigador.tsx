'use client'

import { useRef, useState, useTransition } from 'react'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import { investigar } from '@/modules/ia/investigador'
import { Markdown } from '@/components/Markdown'

const SUGESTOES = [
  'Onde estou em risco de perder a eleição e o que fazer?',
  'Em quais bairros tenho voto mas pouco trabalho mostrado?',
  'Faça um dossiê do bairro Centro: voto, rival e o que já entreguei.',
  'Quais bairros em disputa têm demandas abertas pra eu resolver?',
]

export function Investigador() {
  const [resposta, setResposta] = useState('')
  const [passos, setPassos] = useState<string[]>([])
  const [erro, setErro] = useState('')
  const [pending, start] = useTransition()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function enviar(pergunta: string) {
    const texto = pergunta.trim()
    if (!texto || pending) return
    if (inputRef.current) inputRef.current.value = texto
    setErro('')
    setResposta('')
    setPassos([])
    start(async () => {
      try {
        const r = await investigar(texto)
        setResposta(r.resposta)
        setPassos(r.passos)
      } catch {
        setErro('Falha na investigação. Verifique a IA de fronteira (IA_FRONTIER_KEY com tool-calling).')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            enviar(inputRef.current?.value ?? '')
          }}
        >
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="size-4 text-blue-600" /> Pergunte ao investigador
          </label>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Ele cruza os dados do seu gabinete (eleitoral + demandas + prestação) e devolve um dossiê com números.
          </p>
          <textarea
            ref={inputRef}
            rows={3}
            placeholder="Ex.: onde estou perdendo pro meu rival e o que dá pra fazer ainda este mês?"
            className="mt-3 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition active:scale-95 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {pending ? 'Investigando…' : 'Investigar'}
            </button>
            {erro && <span className="text-sm text-destructive">{erro}</span>}
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              onClick={() => enviar(s)}
              disabled={pending}
              className="rounded-full border border-border px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> consultando as fontes do gabinete…
        </div>
      )}

      {resposta && (
        <div className="rounded-xl border border-border bg-card p-5">
          {passos.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
              <span className="text-xs font-medium text-muted-foreground">Fontes consultadas:</span>
              {passos.map((p, i) => (
                <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {p}
                </span>
              ))}
            </div>
          )}
          <Markdown>{resposta}</Markdown>
        </div>
      )}
    </div>
  )
}
