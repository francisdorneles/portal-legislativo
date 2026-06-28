import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { ChatIA } from '@/components/ChatIA'
import { PageHeader } from '@/components/ui/primitives'

export default async function IAPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="p-8">
      <PageHeader
        title="Assistente"
        subtitle="Pergunte sobre a base do gabinete — respostas com fonte rastreável, isoladas do seu gabinete."
      />
      <ChatIA />
    </div>
  )
}
