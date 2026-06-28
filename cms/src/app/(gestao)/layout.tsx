import React from 'react'
import { Archivo, Public_Sans } from 'next/font/google'
import { camara } from '@/lib/camara.config'
import '../(frontend)/styles.css'

const archivo = Archivo({ subsets: ['latin'], weight: ['500', '600', '800', '900'], variable: '--font-archivo', display: 'swap' })
const publicSans = Public_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-public-sans', display: 'swap' })

export const metadata = {
  title: `Central de Administração — ${camara.nomeCurto}`,
  robots: { index: false, follow: false },
}

/** Layout limpo (sem casca pública) para a Central de Administração. */
export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${publicSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
