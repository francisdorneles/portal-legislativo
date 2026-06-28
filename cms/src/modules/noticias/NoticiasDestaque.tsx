'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatarData } from '@/lib/format'
import type { NoticiaSlide } from './NoticiasRotativas'

const INTERVALO_MS = 5500

/**
 * Notícias em destaque — manchete grande (rotativa) à esquerda + lista das
 * demais à direita. Mantém a rotação automática do rotador antigo, mas com o
 * layout "estilo SAJ": tag sobre a imagem (topo-esquerdo), sem resumo, e a
 * lista lateral alinhada ao topo. Pausa ao passar o mouse.
 */
export function NoticiasDestaque({ noticias }: { noticias: NoticiaSlide[] }) {
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)
  const total = noticias.length

  useEffect(() => {
    if (pausado || total <= 1) return
    const t = setInterval(() => setAtivo((a) => (a + 1) % total), INTERVALO_MS)
    return () => clearInterval(t)
  }, [pausado, total])

  if (total === 0) return null

  const principal = noticias[ativo]
  const laterais = noticias.filter((_, i) => i !== ativo).slice(0, 3)

  return (
    <div className="news" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
      {/* Manchete rotativa */}
      <Link href={`/noticias/${principal.slug}`} className="nmain">
        <div className="ph">
          {principal.imagemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="shot" src={principal.imagemUrl} alt={principal.titulo} />
          ) : (
            <span className="news-sem-foto" aria-hidden="true" />
          )}
          {principal.categoria && <span className="cat">{principal.categoria}</span>}
        </div>
        <div className="bd">
          <h3>{principal.titulo}</h3>
          <span className="date">{formatarData(principal.publicadoEm)}</span>
        </div>
      </Link>

      {/* Lista das demais */}
      <div className="nlist">
        {laterais.map((n) => (
          <Link key={n.id} href={`/noticias/${n.slug}`} className="nitem">
            <div className="ph">
              {n.imagemUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.imagemUrl} alt={n.titulo} loading="lazy" />
              ) : (
                <span className="news-sem-foto" aria-hidden="true" />
              )}
            </div>
            <div className="bd">
              {n.categoria && <div className="cat">{n.categoria}</div>}
              <h4>{n.titulo}</h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
