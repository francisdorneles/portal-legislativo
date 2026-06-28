'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

type Item = { href: string; label: string; exact?: boolean; icon: ReactNode; badge?: string }

function Ic({ d }: { d: string }) {
  return (
    <svg className="h-[18px] w-[18px] flex-none opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      {d.split('|').map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  )
}
function IcCircle() {
  return (
    <svg className="h-[18px] w-[18px] flex-none opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
    </svg>
  )
}

const grupos: { titulo: string; itens: Item[] }[] = [
  {
    titulo: 'Gabinete',
    itens: [
      { href: '/dashboard', label: 'Visão geral', exact: true, icon: <Ic d="M3 12l9-9 9 9|M5 10v10h14V10" /> },
      { href: '/dashboard/ia', label: 'Assistente', icon: <Ic d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" /> },
      { href: '/dashboard/copiloto', label: 'Copiloto', icon: <Ic d="M12 2a7 7 0 0 0-7 7c0 3 2 5 2 7h10c0-2 2-4 2-7a7 7 0 0 0-7-7zM9 21h6" /> },
      { href: '/dashboard/investigador', label: 'Investigador', icon: <Ic d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3" /> },
      { href: '/dashboard/cidadaos', label: 'Cidadãos', icon: <Ic d="M16 8a4 4 0 1 0-8 0 4 4 0 0 0 8 0|M4 21v-1a6 6 0 0 1 12 0v1" /> },
      { href: '/dashboard/demandas', label: 'Demandas', icon: <Ic d="M9 11l3 3 8-8|M4 12v7h16" /> },
      { href: '/dashboard/captura', label: 'Captura', icon: <Ic d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v4" /> },
      { href: '/dashboard/mapa', label: 'Mapa', icon: <Ic d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /> },
      { href: '/dashboard/radar', label: 'Radar', icon: <IcCircle /> },
      { href: '/dashboard/prestacao', label: 'Prestação de contas', icon: <Ic d="M14 3v5h5|M7 3h7l5 5v13H7z" /> },
    ],
  },
  {
    titulo: 'Ações',
    itens: [
      { href: '/dashboard/disparo', label: 'Disparo', icon: <Ic d="M4 4h16v12H7l-3 3z" /> },
      { href: '/dashboard/documentos', label: 'Documentos', icon: <Ic d="M7 3h7l5 5v13H7z|M14 3v5h5" /> },
      { href: '/dashboard/comunicacoes', label: 'Prova de trabalho', icon: <Ic d="M20 6 9 17l-5-5" /> },
    ],
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {grupos.map((g) => (
        <div key={g.titulo}>
          <p className="px-3 pb-1.5 pt-4 text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
            {g.titulo}
          </p>
          {g.itens.map((l) => {
            const ativo = l.exact ? pathname === l.href : pathname.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex min-h-[40px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${
                  ativo
                    ? 'bg-slate-800 text-white shadow-[inset_0_0_0_1px_#29354a]'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {l.icon}
                {l.label}
                {l.badge && (
                  <span className="ml-auto rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                    {l.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
