'use client'

import { useState, useTransition } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { gerarAgendaSemana, type SinalBairro } from '@/modules/ia/copiloto'
import { Panel, PanelHeader, Table, Th, Td, Badge } from '@/components/ui/primitives'
import { Markdown } from '@/components/Markdown'

const TONE = { meu: 'green', disputa: 'amber', rival: 'red', '—': 'slate' } as const
const ROTULO = { meu: 'Meu', disputa: 'Disputa', rival: 'Rival', '—': '—' } as const

export function CopilotoSemana({ inicial }: { inicial?: { agenda: string; sinais: SinalBairro[]; createdAt: string } | null }) {
  const [agenda, setAgenda] = useState<string | null>(inicial?.agenda ?? null)
  const [sinais, setSinais] = useState<SinalBairro[]>(inicial?.sinais ?? [])
  const [geradoEm, setGeradoEm] = useState<string | null>(inicial?.createdAt ?? null)
  const [erro, setErro] = useState(false)
  const [pending, start] = useTransition()

  function gerar() {
    setErro(false)
    start(async () => {
      try {
        const r = await gerarAgendaSemana()
        setAgenda(r.agenda)
        setSinais(r.sinais)
        setGeradoEm(new Date().toISOString())
      } catch {
        setErro(true)
      }
    })
  }

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-foreground">
              <Sparkles className="size-4 text-blue-600" /> Agenda de rua da semana
            </h2>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              A IA cruza disputa eleitoral, demandas abertas e contatos esfriando — e prioriza onde ir.
            </p>
          </div>
          <button
            onClick={gerar}
            disabled={pending}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-95 disabled:opacity-50"
          >
            {agenda == null ? <Sparkles className="size-4" /> : <RefreshCw className="size-4" />}
            {pending ? 'Pensando…' : agenda == null ? 'Gerar agenda' : 'Refazer'}
          </button>
        </div>

        {erro && <p className="px-5 pb-5 text-sm text-destructive">⚠️ Falha ao gerar. Verifique o provedor de IA.</p>}

        {agenda != null && (
          <div className="border-t border-border p-5">
            {geradoEm && (
              <p className="mb-2 text-xs text-muted-foreground">
                Gerada em {new Date(geradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · válida para esta semana
              </p>
            )}
            <Markdown>{agenda}</Markdown>
          </div>
        )}
      </Panel>

      {sinais.length > 0 && (
        <Panel>
          <PanelHeader title="Sinais por bairro (o que a IA analisou)" />
          <Table>
            <thead>
              <tr className="border-y border-border bg-muted/50">
                <Th>Bairro</Th>
                <Th>Disputa</Th>
                <Th className="text-right">Meus votos</Th>
                <Th className="text-right">Demandas abertas</Th>
                <Th className="text-right">Contatos frios</Th>
              </tr>
            </thead>
            <tbody>
              {sinais.map((s) => (
                <tr key={s.bairro} className="transition-colors hover:bg-muted/40">
                  <Td className="font-medium text-foreground">{s.bairro}</Td>
                  <Td><Badge tone={TONE[s.classificacao]}>{ROTULO[s.classificacao]}</Badge></Td>
                  <Td className="text-right tabular-nums">{s.meusVotos}</Td>
                  <Td className="text-right tabular-nums">{s.demandasAbertas}</Td>
                  <Td className="text-right tabular-nums">{s.contatosFrios}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  )
}
