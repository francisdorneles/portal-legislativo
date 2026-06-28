import Link from 'next/link'
import { NovoCidadaoForm } from '@/components/NovoCidadaoForm'

export default function NovoCidadaoPage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link href="/dashboard/cidadaos" className="text-sm text-slate-500 hover:text-slate-900 hover:underline">
        ← Cidadãos
      </Link>
      <h1 className="mb-6 mt-2 text-balance text-2xl font-semibold tracking-tight text-slate-900">Novo cidadão</h1>
      <NovoCidadaoForm />
    </div>
  )
}
