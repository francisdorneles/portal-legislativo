import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArtigoLayout } from '@/components/ui/ArtigoLayout'
import { RichTextContent } from '@/components/ui/RichTextContent'
import { NoticiaCard } from '@/components/ui/NoticiaCard'
import { formatarData } from '@/lib/format'
import { mediaUrl, mediaAlt } from '@/lib/media'
import { obterNoticiaPorSlug, listarNoticiasPublicadas } from '@/modules/noticias/noticias.queries'
import { nomeCurto } from '@/lib/meta'
import { obterConfigCamara } from '@/lib/camara'
import { JsonLd } from '@/components/ui/JsonLd'

export const revalidate = 300

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const [noticia, sf] = await Promise.all([obterNoticiaPorSlug(slug), nomeCurto()])
  return { title: noticia ? `${noticia.titulo} — ${sf}` : 'Notícia não encontrada' }
}

export default async function NoticiaPage({ params }: Params) {
  const { slug } = await params
  const [noticia, config] = await Promise.all([obterNoticiaPorSlug(slug), obterConfigCamara()])
  if (!noticia) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3003'
  const nome = config.nomeOficial || config.nomeCurto || 'Portal Legislativo'
  const fotoAbsoluta = mediaUrl(noticia.foto)
    ? `${siteUrl}${mediaUrl(noticia.foto)}`
    : undefined

  const recentes = (await listarNoticiasPublicadas(5)).filter((n) => n.id !== noticia.id).slice(0, 4)

  const rodape = recentes.length > 0 ? (
    <section aria-labelledby="t-rec" style={{ marginTop: '2.5rem' }}>
      <h2 id="t-rec" className="sec-titulo">Últimas notícias</h2>
      <div className="noticias noticias--compacto">
        {recentes.map((n) => (
          <NoticiaCard key={n.id} noticia={n} />
        ))}
      </div>
    </section>
  ) : undefined

  return (
    <>
    <JsonLd data={{
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: noticia.titulo.slice(0, 110),
      ...(fotoAbsoluta && { image: [fotoAbsoluta] }),
      datePublished: noticia.createdAt,
      dateModified: noticia.updatedAt,
      description: noticia.resumo?.slice(0, 160),
      author: { '@type': 'Organization', name: nome },
      publisher: {
        '@type': 'Organization',
        name: nome,
        ...(config.logoUrl && { logo: { '@type': 'ImageObject', url: config.logoUrl } }),
      },
    }} />
    <ArtigoLayout
      titulo={noticia.titulo}
      data={formatarData(noticia.data)}
      fotoUrl={mediaUrl(noticia.foto) ?? undefined}
      fotoAlt={mediaAlt(noticia.foto, noticia.titulo)}
      rodape={rodape}
      centralizar
    >
      <RichTextContent data={noticia.corpo} />
    </ArtigoLayout>
    </>
  )
}
