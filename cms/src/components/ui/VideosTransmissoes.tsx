import type { VideoYoutube } from '@/lib/youtube'
import { formatarData } from '@/lib/format'

/**
 * Grade de transmissões/vídeos — cards com capa, selo, botão de play no hover
 * e data. Alimentada pelos últimos vídeos do canal (lib/youtube).
 */
export function VideosTransmissoes({ videos }: { videos: VideoYoutube[] }) {
  if (videos.length === 0) return null
  return (
    <div className="transmissoes">
      {videos.slice(0, 3).map((v, i) => (
        <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="transmissao" title={v.titulo}>
          <div className="transmissao__thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.thumb} alt="" aria-hidden="true" loading="lazy" />
            <span className="transmissao__selo">{i === 0 ? 'Mais recente' : 'Vídeo'}</span>
            <span className="transmissao__play" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </div>
          <h3 className="transmissao__titulo">{v.titulo}</h3>
          {v.publicado && <span className="transmissao__data">{formatarData(v.publicado)}</span>}
        </a>
      ))}
    </div>
  )
}
