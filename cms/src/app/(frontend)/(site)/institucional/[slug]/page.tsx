import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { RichTextContent } from '@/components/ui/RichTextContent'
import { obterPaginaPorSlug } from '@/modules/institucional/paginas.queries'
import { nomeCurto } from '@/lib/meta'

export const revalidate = 3600

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const [pagina, sf] = await Promise.all([obterPaginaPorSlug(slug), nomeCurto()])
  return { title: pagina ? `${pagina.titulo} — ${sf}` : 'Página não encontrada' }
}

export default async function InstitucionalPage({ params }: Params) {
  const { slug } = await params
  const pagina = await obterPaginaPorSlug(slug)
  if (!pagina) notFound()

  return (
    <ArtigoLayout titulo={pagina.titulo}>
      <RichTextContent data={pagina.conteudo} />
    </ArtigoLayout>
  )
}
