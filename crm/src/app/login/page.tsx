'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const form = new FormData(e.currentTarget)
    const res = await signIn('credentials', {
      email: form.get('email'),
      senha: form.get('senha'),
      redirect: false,
    })
    setCarregando(false)
    if (res?.error) {
      setErro('E-mail ou senha inválidos.')
      return
    }
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-900">CRM Legislativo</h1>
          <p className="text-sm text-slate-500">Acesso do gabinete</p>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">E-mail</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Senha</span>
          <input
            name="senha"
            type="password"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          />
        </label>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-lg bg-slate-900 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
