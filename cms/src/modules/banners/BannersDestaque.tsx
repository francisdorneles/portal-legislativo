import { listarBannersAtivos } from './banners.queries'
import { mediaUrl, mediaAlt } from '@/lib/media'
import { BannersCarrossel, type BannerSlide } from './BannersCarrossel'

/**
 * Faixa de banners da home. Server Component — busca os dados e delega
 * a renderização rotativa ao client component `BannersCarrossel`.
 */
export async function BannersDestaque() {
  const banners = await listarBannersAtivos()
  if (banners.length === 0) return null

  const slides: BannerSlide[] = banners.map((b) => ({
    id: String(b.id),
    titulo: b.titulo,
    link: b.link ?? null,
    src: mediaUrl(b.imagem),
    alt: mediaAlt(b.imagem, b.titulo),
  }))

  return (
    <section className="wrap" aria-label="Destaques">
      <BannersCarrossel slides={slides} />
    </section>
  )
}
