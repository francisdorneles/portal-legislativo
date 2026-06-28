export const dynamic = 'force-dynamic'

import React from 'react'
import { Archivo, Public_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import { obterConfigCamara } from '@/lib/camara'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { VLibras } from '@/components/layout/VLibras'
import { UmamiAnalytics } from '@/components/layout/UmamiAnalytics'
import { JsonLd } from '@/components/ui/JsonLd'
import './styles.css'

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['500', '600', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
})
const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-public-sans',
  display: 'swap',
})
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
})

export async function generateMetadata() {
  const c = await obterConfigCamara()
  const nome = c.nomeOficial || c.nomeCurto || 'Portal Legislativo'
  const descricao = `Portal oficial da ${nome}${c.uf ? `/${c.uf}` : ''} — processo legislativo, sessões, legislação e transparência.`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3003'

  return {
    metadataBase: new URL(siteUrl),
    title: { default: nome, template: `%s — ${c.nomeCurto || nome}` },
    description: descricao,
    openGraph: {
      type: 'website' as const,
      locale: 'pt_BR',
      siteName: nome,
      description: descricao,
      images: c.logoUrl ? [{ url: c.logoUrl, alt: nome }] : ['/og-image.png'],
    },
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const c = await obterConfigCamara()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3003'
  const nome = c.nomeOficial || c.nomeCurto || 'Portal Legislativo'

  return (
    <html lang="pt-BR" className={`${archivo.variable} ${publicSans.variable} ${jakarta.variable}`}>
      <body>
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'GovernmentOrganization',
          name: nome,
          url: siteUrl,
          ...(c.logoUrl && { logo: c.logoUrl }),
          address: {
            '@type': 'PostalAddress',
            streetAddress: c.contato.endereco,
            addressLocality: c.cidade,
            addressRegion: c.uf || 'RS',
            addressCountry: 'BR',
          },
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: c.contato.telefone,
            contactType: 'customer service',
            ...(c.contato.email && { email: c.contato.email }),
          },
        }} />
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo">{children}</main>
        <SiteFooter />
        <CookieBanner />
        <VLibras />
        <UmamiAnalytics />
      </body>
    </html>
  )
}
