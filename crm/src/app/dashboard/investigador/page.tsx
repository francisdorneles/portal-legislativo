import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Investigador } from '@/components/Investigador'
import { PageHeader } from '@/components/ui/primitives'

export default async function InvestigadorPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="p-8">
      <PageHeader
        title="Investigador"
        subtitle="Pergunte em linguagem natural — a IA cruza as fontes do gabinete e monta o dossiê."
      />
      <Investigador />
    </div>
  )
}
