'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { Item } from './menu'

export function MainNav({ menu }: { menu: Item[] }) {
  const [aberto, setAberto] = useState<string | null>(null)
  const [mobile, setMobile] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const pathname = usePathname()

  const ativo = (item: Item) =>
    item.href === pathname ||
    item.children?.some((c) => pathname.startsWith(c.href) && c.href !== '/')

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setAberto(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAberto(null); setMobile(false) }
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const fechar = () => { setAberto(null); setMobile(false) }

  return (
    <nav className="principal" aria-label="Menu principal" ref={navRef}>
      <button
        className="nav-toggle"
        aria-expanded={mobile}
        aria-controls="menu-lista"
        aria-label={mobile ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setMobile((v) => !v)}
      >
        {mobile ? (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="4" x2="18" y2="18" />
            <line x1="18" y1="4" x2="4" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="19" y2="6" />
            <line x1="3" y1="11" x2="19" y2="11" />
            <line x1="3" y1="16" x2="19" y2="16" />
          </svg>
        )}
      </button>

      <ul id="menu-lista" className={mobile ? 'aberto' : ''}>
        {menu.map((item) =>
          item.children ? (
            <li key={item.label} className={`tem-sub ${ativo(item) ? 'on' : ''}`}>
              <button
                aria-haspopup="true"
                aria-expanded={aberto === item.label}
                onClick={() => setAberto((a) => (a === item.label ? null : item.label))}
              >
                {item.label}
                <span className="seta" aria-hidden="true">▾</span>
              </button>
              <div
                className={`sub ${aberto === item.label ? 'aberto' : ''} ${item.alinharDireita ? 'sub-right' : ''}`}
                style={(() => {
                  const n = item.children.length
                  const cols = Math.ceil(n / 6)
                  const rows = Math.ceil(n / cols)
                  return { '--cols': cols, '--rows': rows } as React.CSSProperties
                })()}
              >
                {item.children.map((c) =>
                  c.externo ? (
                    <a className="sub-item" href={c.href} key={c.label} target="_blank" rel="noopener noreferrer" onClick={fechar}>
                      <span className="sub-ic" aria-hidden="true">
                        <Icon name={c.icon} size={20} />
                      </span>
                      <span className="sub-tx">
                        <span className="sub-tit">{c.label} ↗</span>
                        <span className="sub-desc">{c.desc}</span>
                      </span>
                    </a>
                  ) : (
                    <Link className="sub-item" href={c.href} key={c.label} onClick={fechar}>
                      <span className="sub-ic" aria-hidden="true">
                        <Icon name={c.icon} size={20} />
                      </span>
                      <span className="sub-tx">
                        <span className="sub-tit">{c.label}</span>
                        <span className="sub-desc">{c.desc}</span>
                      </span>
                    </Link>
                  ),
                )}
              </div>
            </li>
          ) : (
            <li key={item.label} className={ativo(item) ? 'on' : ''}>
              <Link href={item.href!} aria-current={item.href === pathname ? 'page' : undefined} onClick={fechar}>
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  )
}
