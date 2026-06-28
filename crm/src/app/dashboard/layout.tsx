import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { DashboardNav } from '@/components/DashboardNav'

function iniciais(nome?: string | null) {
  if (!nome) return 'U'
  return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-1 bg-slate-900 p-3.5 text-slate-300 print:hidden">
        {/* brand */}
        <div className="flex items-center gap-2.5 px-2 pb-4 pt-1.5">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-white shadow-md">
            R
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-tight tracking-tight text-white">Radar</p>
            <p className="text-[11px] font-medium text-slate-500">Inteligência de Mandato</p>
          </div>
        </div>

        <DashboardNav />

        {/* usuário */}
        <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-[13px] font-semibold text-slate-100">
            {iniciais(session.user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">{session.user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{session.user.email}</p>
          </div>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <button
              title="Sair"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto print:overflow-visible">{children}</main>
    </div>
  )
}
