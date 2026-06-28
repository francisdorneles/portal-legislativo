import Link from 'next/link'
import Image from 'next/image'
import { MainNav } from './MainNav'
import { construirMenu } from './menu'
import { AcessibilidadeControls } from './AcessibilidadeControls'
import { StickyShell } from './StickyShell'
import { obterConfigCamara } from '@/lib/camara'
import { listarPaginasMenu } from '@/modules/institucional/paginas.queries'

export async function SiteHeader() {
  const [camara, paginasMenu] = await Promise.all([obterConfigCamara(), listarPaginasMenu()])
  const menu = construirMenu(camara, paginasMenu)
  const { facebook, instagram, youtube } = camara.redes
  return (
    <StickyShell>
      <header className="main">
        <div className="nav-bar">
          <div className="wrap">
            <Link className="brand" href="/">
              {camara.logoUrl ? (
                <Image className="brand-logo" src={camara.logoUrl} alt={camara.nomeCurto} width={38} height={38} />
              ) : (
                <span className="blk" aria-hidden="true">
                  {camara.inicial}
                </span>
              )}
              <span>
                <span>Câmara Municipal</span>
                <b>{camara.nomeCurto}</b>
              </span>
            </Link>
            <div className="nav-divisor" aria-hidden="true" />
            <MainNav menu={menu} />
            <div className="nav-redes" aria-label="Redes sociais e acessibilidade">
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rede-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rede-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                </a>
              )}
              {youtube && (
                <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rede-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
                </a>
              )}
              <AcessibilidadeControls />
            </div>
          </div>
        </div>
      </header>
    </StickyShell>
  )
}
