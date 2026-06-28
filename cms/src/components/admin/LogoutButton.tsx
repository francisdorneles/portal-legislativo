'use client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      title="Sair"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.75rem',
        borderRadius: '7px',
        border: '1px solid #dce5f0',
        background: 'transparent',
        color: '#6b7280',
        fontSize: '0.82rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: '0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = '#dc2626'
        el.style.color = '#dc2626'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = '#dce5f0'
        el.style.color = '#6b7280'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Sair
    </button>
  )
}
