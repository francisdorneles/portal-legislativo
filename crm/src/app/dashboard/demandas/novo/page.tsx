import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { NovaDemandaForm } from '@/components/NovaDemandaForm'

export default async function NovaDemandaPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link href="/dashboard/demandas" className="text-sm text-slate-500 hover:text-slate-900 hover:underline">
        ← Demandas
      </Link>
      <h1 className="mb-6 mt-2 text-balance text-2xl font-semibold tracking-tight text-slate-900">Nova demanda</h1>
      <NovaDemandaForm />
    </div>
  )
}
