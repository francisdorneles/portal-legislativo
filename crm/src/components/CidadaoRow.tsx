'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageCircle, PhoneCall, Pencil, Trash2 } from 'lucide-react'
import { excluirCidadao, registrarContato } from '@/modules/crm/cidadaos.actions'
import { temperatura, TEMP_LABEL, TEMP_COR } from '@/modules/crm/relacionamento'
import { linkWhatsApp } from '@/lib/whatsapp'
import { Td, Badge, iconBtnCls, iconBtnDangerCls } from '@/components/ui/primitives'

export type CidadaoLinha = {
  id: string
  nome: string
  email: string | null
  bairro: string | null
  telefone: string | null
  tipoContato: string
  tags: string[]
  ultimoContato: Date | string | null
}

function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

/** Linha da grid de cidadãos: clicar edita; ações em ícones (não propagam o clique). */
export function CidadaoRow({ c }: { c: CidadaoLinha }) {
  const router = useRouter()
  const t = temperatura(c.ultimoContato ? new Date(c.ultimoContato) : null)
  const wa = linkWhatsApp(c.telefone)
  const editar = `/dashboard/cidadaos/${c.id}`
  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <tr onClick={() => router.push(editar)} className="cursor-pointer transition-colors duration-100 hover:bg-muted/40">
      <Td>
        <div className="flex items-center gap-3">
          <span className="grid size-9 flex-none place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {iniciais(c.nome)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-foreground">{c.nome}</span>
              {c.tipoContato === 'LIDERANCA' && <Badge tone="indigo">Liderança</Badge>}
            </div>
            <div className="truncate text-xs text-muted-foreground">{c.email || c.telefone || '—'}</div>
          </div>
        </div>
      </Td>
      <Td>{c.bairro || <span className="text-muted-foreground">—</span>}</Td>
      <Td>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TEMP_COR[t]}`}>
          {TEMP_LABEL[t]}
        </span>
      </Td>
      <Td className="text-right" onClick={stop}>
        <div className="flex items-center justify-end gap-0.5">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp" className={iconBtnCls}>
              <MessageCircle />
            </a>
          )}
          <form action={registrarContato.bind(null, c.id)}>
            <button type="submit" title="Registrar contato" aria-label="Registrar contato" className={iconBtnCls}>
              <PhoneCall />
            </button>
          </form>
          <Link href={editar} title="Editar" aria-label="Editar" className={iconBtnCls}>
            <Pencil />
          </Link>
          <form action={excluirCidadao.bind(null, c.id)}>
            <button
              type="submit"
              title="Excluir"
              aria-label="Excluir"
              className={iconBtnDangerCls}
              onClick={(e) => {
                if (!confirm(`Excluir ${c.nome}?`)) e.preventDefault()
              }}
            >
              <Trash2 />
            </button>
          </form>
        </div>
      </Td>
    </tr>
  )
}
