import Link from 'next/link'
import { formatarData } from '@/lib/format'
import { listarVideos } from '@/modules/legislativo/videos.queries'
import { metaTitulo } from '@/lib/meta'

export const revalidate = 300

export async function generateMetadata() { return metaTitulo('Vídeos') }

export default async function VideosPage() {
  const videos = await listarVideos()

  return (
    <>
      <h1>Acervo de Vídeos</h1>
      <p style={{ color: 'var(--cinza)', marginTop: '-0.5rem' }}>
        Gravações das sessões plenárias e audiências públicas.
      </p>

      {videos.length === 0 ? (
        <p className="vazio">Nenhum vídeo disponível ainda.</p>
      ) : (
        <ul className="videos">
          {videos.map((v) => (
            <li key={v.id}>
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="video-thumb">
                {v.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumb} alt="" loading="lazy" />
                ) : (
                  <span className="video-sem-thumb">Vídeo</span>
                )}
                <span className="video-play" aria-hidden>▶</span>
              </a>
              <div className="video-info">
                <span className="video-data">{formatarData(v.data)}</span>
                <Link href={v.href} className="video-titulo">{v.titulo}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
