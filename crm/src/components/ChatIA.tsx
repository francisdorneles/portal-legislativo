'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Send, Sparkles, FileText } from 'lucide-react'
import { perguntarIA, type Fonte } from '@/modules/ia/chat.actions'
import { Markdown } from '@/components/Markdown'

type Msg = { de: 'eu' | 'ia'; texto: string; fontes?: Fonte[] }

const SUGESTOES = [
  'Quais demandas de iluminação estão registradas?',
  'O que já foi feito no Centro?',
  'Resumir as demandas do bairro São João',
]

export function ChatIA() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [pending, start] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  function enviar(pergunta: string) {
    const texto = pergunta.trim()
    if (!texto || pending) return
    setMsgs((m) => [...m, { de: 'eu', texto }])
    if (inputRef.current) inputRef.current.value = ''
    start(async () => {
      try {
        const r = await perguntarIA(texto)
        setMsgs((m) => [...m, { de: 'ia', texto: r.resposta, fontes: r.fontes }])
      } catch {
        setMsgs((m) => [...m, { de: 'ia', texto: '⚠️ Falha ao consultar a IA. Verifique se o provedor (Ollama) está no ar.' }])
      }
      requestAnimationFrame(() => fimRef.current?.scrollIntoView({ behavior: 'smooth' }))
    })
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col rounded-xl border border-border bg-card">
      {/* mensagens */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 grid size-12 place-items-center rounded-full bg-blue-50 text-blue-600">
              <Sparkles className="size-6" />
            </div>
            <p className="font-medium text-foreground">Pergunte sobre a base do seu gabinete</p>
            <p className="mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
              A IA responde só com os dados do seu gabinete e cita a fonte de cada informação.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGESTOES.map((s) => (
                <button key={s} onClick={() => enviar(s)} className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={m.de === 'eu' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.de === 'eu' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'}`}>
              {m.de === 'ia' ? <Markdown>{m.texto}</Markdown> : <p className="whitespace-pre-wrap text-pretty">{m.texto}</p>}
              {m.fontes && m.fontes.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-border/60 pt-2.5">
                  <p className="text-xs font-medium text-muted-foreground">Fontes</p>
                  {m.fontes.map((f) => {
                    const inner = (
                      <span className="flex items-start gap-2">
                        <span className="mt-0.5 grid size-4 flex-none place-items-center rounded bg-muted text-[10px] font-bold text-muted-foreground">{f.n}</span>
                        <FileText className="mt-0.5 size-3.5 flex-none text-muted-foreground" />
                        <span className="line-clamp-1 text-muted-foreground">{f.texto}</span>
                      </span>
                    )
                    return f.origem === 'demanda' ? (
                      <Link key={f.n} href={`/dashboard/demandas/${f.referenciaId}`} className="block rounded-md px-1.5 py-1 text-xs hover:bg-muted">{inner}</Link>
                    ) : (
                      <div key={f.n} className="px-1.5 py-1 text-xs">{inner}</div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </span>
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {/* input */}
      <form
        onSubmit={(e) => { e.preventDefault(); enviar(inputRef.current?.value ?? '') }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          ref={inputRef}
          placeholder="Pergunte algo sobre o gabinete…"
          className="h-10 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
        <button type="submit" disabled={pending} className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground transition active:scale-95 disabled:opacity-50">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  )
}
