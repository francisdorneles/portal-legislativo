import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { CapturaRapida } from '@/components/CapturaRapida'
import { PageHeader } from '@/components/ui/primitives'

export default async function CapturaPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="p-8">
      <PageHeader
        title="Captura"
        subtitle="Do relato de rua à demanda estruturada — a IA faz o trabalho chato."
      />
      <CapturaRapida />
    </div>
  )
}
