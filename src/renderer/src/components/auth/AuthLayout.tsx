import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="h-screen w-screen flex items-center justify-center"
      style={{ background: '#111315' }}
    >
      {children}
    </div>
  )
}
