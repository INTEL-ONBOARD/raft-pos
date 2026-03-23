import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, LogOut, ShoppingBag } from 'lucide-react'
import { ErrorBoundary } from '../ErrorBoundary'
import { useAuth } from '../../hooks/useAuth'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'

const AVATAR_COLORS = [
  { bg: 'rgba(79,70,229,0.12)',  color: '#4338CA' },
  { bg: 'rgba(22,163,74,0.12)',  color: '#15803d' },
  { bg: 'rgba(217,119,6,0.12)',  color: '#b45309' },
  { bg: 'rgba(220,38,38,0.12)',  color: '#dc2626' },
  { bg: 'rgba(29,78,216,0.12)',  color: '#1d4ed8' },
  { bg: 'rgba(124,58,237,0.12)', color: '#7c3aed' },
  { bg: 'rgba(13,148,136,0.12)', color: '#0d9488' },
  { bg: 'rgba(194,65,12,0.12)',  color: '#c2410c' },
]

function getAvatarColor(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clearAuth } = useAuth()

  const isHome = location.pathname === '/' || location.pathname === '/home'

  const avatarColor = user?.name ? getAvatarColor(user.name) : AVATAR_COLORS[0]
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  async function handleLogout() {
    try { await ipc.invoke(IPC.AUTH_LOGOUT) } finally { clearAuth() }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-5 shrink-0"
        style={{
          height: '56px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Left: logo + back */}
        <div className="flex items-center gap-3">
          {/* Brand */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--accent-light)' }}
            >
              <ShoppingBag className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Raft POS</span>
          </button>

          {/* Back button — shown on any non-home page */}
          {!isHome && (
            <>
              <span style={{ color: 'var(--border-default)', fontSize: '18px', fontWeight: 300 }}>/</span>
              <button
                onClick={() => navigate('/home')}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Home
              </button>
            </>
          )}
        </div>

        {/* Right: avatar + logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: avatarColor.bg, color: avatarColor.color }}
            >
              {initials}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {user?.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.borderColor = 'var(--color-danger-border)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
