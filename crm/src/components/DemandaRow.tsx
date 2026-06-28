'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { excluirDemanda } from '@/modules/crm/demandas.actions'
import { Td, Badge, iconBtnCls, iconBtnDangerCls } from '@/components/ui/primitives'

const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  ENCAMINHADA: 'Encaminhada',
  RESOLVIDA: 'Resolvida',
}
const STATUS_TONE = {
  ABERTA: 'amber',
  EM_ANDAMENTO: 'blue',
  ENCAMINHADA: 'violet',
  RESOLVIDA: 'green',
} as const

export type DemandaLinha = {
  id: string
  titulo: string
  tema: string | null
  bairro: string | null
  status: string
  cidadao?: { nome: string } | null
}

export function DemandaRow({ d }: { d: DemandaLinha }) {
  const router = useRouter()
  const abrir = `/dashboard/demandas/${d.id}`
  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <tr onClick={() => router.push(abrir)} className="cursor-pointer transition-colors duration-100 hover:bg-muted/40">
      <Td>
        <div className="font-medium text-foreground">{d.titulo}</div>
        <div className="text-xs text-muted-foreground">{d.tema || 'Sem tema'}</div>
      </Td>
      <Td>{d.bairro || <span className="text-muted-foreground">—</span>}</Td>
      <Td>{d.cidadao?.nome || <span className="text-muted-foreground">—</span>}</Td>
      <Td>
        <Badge tone={STATUS_TONE[d.status as keyof typeof STATUS_TONE]} dot>
          {STATUS_LABEL[d.status]}
        </Badge>
      </Td>
      <Td className="text-right" onClick={stop}>
        <div className="flex items-center justify-end gap-0.5">
          <Link href={abrir} title="Editar" aria-label="Editar" className={iconBtnCls}>
            <Pencil />
          </Link>
          <form action={excluirDemanda.bind(null, d.id)}>
            <button
              type="submit"
              title="Excluir"
              aria-label="Excluir"
              className={iconBtnDangerCls}
              onClick={(e) => {
                if (!confirm(`Excluir a demanda "${d.titulo}"?`)) e.preventDefault()
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
