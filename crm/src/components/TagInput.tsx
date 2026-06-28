'use client'

import { useState } from 'react'

/**
 * Editor de tags com vocabulário controlado por reúso: chips das tags existentes pra clicar
 * + campo pra criar nova. O valor vai num input escondido `name="tags"` (vírgula-separado),
 * então a server action de cidadão não muda.
 */
export function TagInput({ sugestoes, iniciais = [] }: { sugestoes: string[]; iniciais?: string[] }) {
  const [tags, setTags] = useState<string[]>(iniciais)
  const [input, setInput] = useState('')

  const add = (t: string) => {
    const v = t.trim()
    if (v && !tags.includes(v)) setTags([...tags, v])
    setInput('')
  }
  const remove = (t: string) => setTags(tags.filter((x) => x !== t))
  const disponiveis = sugestoes.filter((s) => !tags.includes(s))

  return (
    <div className="space-y-2 sm:col-span-2">
      <input type="hidden" name="tags" value={tags.join(',')} />

      <div className="flex flex-wrap items-center gap-1.5">
        {tags.length === 0 && <span className="text-xs text-slate-400">nenhuma tag</span>}
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => remove(t)}
            className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            {t} ✕
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(input)
            }
          }}
          placeholder="nova tag + Enter"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-100"
        >
          +
        </button>
      </div>

      {disponiveis.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {disponiveis.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
