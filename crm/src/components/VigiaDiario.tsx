'use client'

import { useState, useTransition } from 'react'
import { Newspaper, ExternalLink } from 'lucide-react'
import { varrerDiario, type ResumoVigia } from '@/modules/ia/vigia'
import { Panel } from '@/components/ui/primitives'

export function VigiaDiario({ inicial }: { inicial?: { achados: ResumoVigia['achados']; createdAt: string } | null }) {
  const [res, setRes] = useState<ResumoVigia | null>(
    inicial ? { termos: [], achados: inicial.achados, alertasCriados: 0 } : null,
  )
  const [geradoEm, setGeradoEm] = useState<string | null>(inicial?.createdAt ?? null)
  const [pending, start] = useTransition()

  function varrer() {
    start(async () => {
      try {
        setRes(await varrerDiario())
        setGeradoEm(new Date().toISOString())
      } catch {
        setRes({ termos: [], achados: [], alertasCriados: 0, erro: 'Falha ao varrer. Verifique a IA/conector.' })
      }
    })
  }

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 p-5">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Newspaper className="size-4 text-blue-600" /> Vigia do Diário Oficial
          </h2>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Varre o diário do município e cruza com seus bairros e indicações — com resumo da IA.
          </p>
        </div>
        <button onClick={varrer} disabled={pending} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-95 disabled:opacity-50">
          <Newspaper className="size-4" /> {pending ? 'Varrendo…' : 'Varrer diário'}
        </button>
      </div>

      {res?.erro && (
        <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
          ⚠️ {res.erro}
          <p className="mt-1 text-xs">
            A API pública (Querido Diário) fica atrás de Cloudflare e pode bloquear o servidor. Em produção,
            aponte <code>QD_API_URL</code> para uma instância acessível (ou self-hosted via Docker).
          </p>
        </div>
      )}

      {res && !res.erro && (
        <div className="border-t border-border p-5">
          {res.achados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada relevante no diário para os termos: {res.termos.join(', ')}.</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                {geradoEm && `Última varredura: ${new Date(geradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · `}
                {res.termos.length > 0 && `termos: ${res.termos.join(', ')}`}
              </p>
              <ul className="space-y-3">
                {res.achados.map((a, i) => (
                  <li key={i} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">{a.data}</span>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
                        diário <ExternalLink className="size-3" />
                      </a>
                    </div>
                    <p className="mt-1 text-pretty text-sm text-foreground">{a.resumo}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Panel>
  )
}
