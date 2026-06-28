import { ReactNode } from 'react'

export function StickyShell({ children }: { children: ReactNode }) {
  return (
    <div className="sticky-shell">
      {children}
    </div>
  )
}
