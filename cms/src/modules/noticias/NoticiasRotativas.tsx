'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatarData } from '@/lib/format'

export type NoticiaSlide = {
  id: string
  slug: string
  titulo: string
  categoria: string | null
  publicadoEm: string
  imagemUrl: string | null
}

const INTERVALO_MS = 5500

export function NoticiasRotativas({ noticias }: { noticias: NoticiaSlide[] }) {
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
  const miniaturas = noticias.filter((_, i) => i !== ativo).slice(0, 4)

  return (
    <div
      className="not-rot"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Card principal */}
      <Link href={`/noticias/${principal.slug}`} className="not-rot__principal">
        <div className="not-rot__img">
          {principal.imagemUrl
            ? <img src={principal.imagemUrl} alt={principal.titulo} />
            : <span className="not-rot__sem-foto" />}
        </div>
        <div className="not-rot__info">
          <span className="not-rot__meta">
            {principal.categoria && <b>{principal.categoria}</b>}
            {principal.categoria && ' · '}
            {formatarData(principal.publicadoEm)}
          </span>
          <p className="not-rot__titulo">{principal.titulo}</p>
        </div>
        <div className="not-rot__dots">
          {noticias.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Notícia ${i + 1}`}
              aria-pressed={i === ativo}
              className={`not-rot__dot${i === ativo ? ' is-ativo' : ''}`}
              onClick={(e) => { e.preventDefault(); setAtivo(i) }}
            />
          ))}
        </div>
      </Link>

      {/* Miniaturas */}
      <div className="not-rot__mini-lista">
        {miniaturas.map((n) => (
          <Link key={n.id} href={`/noticias/${n.slug}`} className="not-rot__mini">
            <div className="not-rot__mini-img">
              {n.imagemUrl
                ? <img src={n.imagemUrl} alt={n.titulo} loading="lazy" />
                : <span className="not-rot__sem-foto" />}
            </div>
            <div className="not-rot__mini-tx">
              <span className="not-rot__meta">
                {n.categoria && <b>{n.categoria}</b>}
                {n.categoria && ' · '}
                {formatarData(n.publicadoEm)}
              </span>
              <p className="not-rot__mini-titulo">{n.titulo}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
