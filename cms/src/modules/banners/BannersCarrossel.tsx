'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

export type BannerSlide = {
  id: string
  titulo: string
  link: string | null
  src: string | null
  alt: string
}

const INTERVALO_MS = 6000

/**
 * Carrossel rotativo de banners. Autoplay com pausa no hover/foco.
 * Se houver apenas 1 slide, renderiza estático (sem controles).
 */
export function BannersCarrossel({
  slides,
  variante = 'destaque',
}: {
  slides: BannerSlide[]
  /** "destaque" = faixa larga (21:7). "lado" = bloco quadrado pra coluna lateral. */
  variante?: 'destaque' | 'lado'
}) {
  const [atual, setAtual] = useState(0)
  const [pausado, setPausado] = useState(false)
  const total = slides.length
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const ir = useCallback(
    (i: number) => setAtual(((i % total) + total) % total),
    [total],
  )

  useEffect(() => {
    if (total <= 1 || pausado) return
    timerRef.current = setInterval(() => {
      setAtual((a) => (a + 1) % total)
    }, INTERVALO_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [total, pausado])

  if (total === 0) return null

  return (
    <div
      className={`banners-carrossel banners-carrossel--${variante}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Banners de destaque"
    >
      <div className="banners-carrossel__viewport">
        {slides.map((s, i) => (
          <SlideBanner key={s.id} slide={s} ativo={i === atual} indice={i} total={total} />
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="banners-carrossel__nav banners-carrossel__nav--prev"
            onClick={() => ir(atual - 1)}
            aria-label="Banner anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="banners-carrossel__nav banners-carrossel__nav--next"
            onClick={() => ir(atual + 1)}
            aria-label="Próximo banner"
          >
            ›
          </button>

          <div className="banners-carrossel__dots" role="tablist" aria-label="Selecionar banner">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === atual}
                aria-label={`Banner ${i + 1}: ${s.titulo}`}
                className={`banners-carrossel__dot${i === atual ? ' is-ativo' : ''}`}
                onClick={() => ir(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SlideBanner({
  slide,
  ativo,
  indice,
  total,
}: {
  slide: BannerSlide
  ativo: boolean
  indice: number
  total: number
}) {
  const conteudo = slide.src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={slide.src} alt={slide.alt} />
  ) : (
    <span className="banner-fallback">{slide.titulo}</span>
  )

  const props = {
    className: `banners-carrossel__slide${ativo ? ' is-ativo' : ''}`,
    'aria-hidden': !ativo,
    'aria-roledescription': 'slide',
    'aria-label': `${indice + 1} de ${total}`,
    tabIndex: ativo ? 0 : -1,
  } as const

  return slide.link ? (
    <Link href={slide.link} {...props}>
      {conteudo}
    </Link>
  ) : (
    <div {...props} role="group">
      {conteudo}
    </div>
  )
}
