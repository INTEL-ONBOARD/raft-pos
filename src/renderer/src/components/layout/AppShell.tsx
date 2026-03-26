import { useRef, useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft, ShoppingBag, Bell, AlertTriangle,
  CreditCard, ArrowLeftRight, CheckCircle, Settings, LogOut, Search,
} from 'lucide-react'
import { ErrorBoundary } from '../ErrorBoundary'
import { useAuth } from '../../hooks/useAuth'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useDashboard } from '../../hooks/useDashboard'
import { useInventory } from '../../hooks/useInventory'
import { useCashDrawer } from '../../hooks/useCashDrawer'
import { useNotifications, type AppNotification } from '../../hooks/useNotifications'

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

const SEARCH_ROUTES: Array<{ keywords: string[]; path: string }> = [
  { keywords: ['product', 'item', 'sku', 'catalog'], path: '/products' },
  { keywords: ['supplier', 'vendor'], path: '/suppliers' },
  { keywords: ['transaction', 'sale', 'receipt', 'refund', 'void'], path: '/transactions' },
  { keywords: ['user', 'staff', 'employee', 'cashier'], path: '/users' },
]

function resolveSearchRoute(query: string): string {
  const lower = query.toLowerCase()
  for (const { keywords, path } of SEARCH_ROUTES) {
    if (keywords.some((k) => lower.includes(k))) return path
  }
  return '/products'
}

const NOTIFICATION_ICONS: Record<AppNotification['icon'], React.ElementType> = {
  warning: AlertTriangle,
  cash: CreditCard,
  transaction: ArrowLeftRight,
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, clearAuth } = useAuth()

  const isHome = location.pathname === '/' || location.pathname === '/home'

  const avatarColor = user?.name ? getAvatarColor(user.name) : AVATAR_COLORS[0]
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !searchQuery.trim()) return
    const path = resolveSearchRoute(searchQuery.trim())
    navigate(`${path}?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchQuery('')
    searchRef.current?.blur()
  }

  // Notifications data
  const { data: dashboardData } = useDashboard()
  const statsResult = dashboardData !== undefined
    ? { success: true as const, data: dashboardData }
    : undefined
  const { stockQuery } = useInventory()
  const { openDrawerQuery } = useCashDrawer()

  const notifications = useNotifications({
    statsResult,
    stockData: stockQuery.data ?? [],
    drawerStatus: openDrawerQuery.data?.status,
  })

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notifOpen) return
    function onMouseDown(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [notifOpen])

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [profileOpen])

  async function handleLogout() {
    setProfileOpen(false)
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
        <div className="flex items-center gap-2">
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
              <span aria-hidden="true" style={{ fontSize: '13px', color: 'var(--text-disabled)', lineHeight: 1, userSelect: 'none' }}>·</span>
              <button
                onClick={() => navigate('/home')}
                aria-label="Go home"
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{ width: '28px', height: '28px', color: 'var(--text-muted)', background: 'transparent', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden={true} />
              </button>
            </>
          )}
        </div>

        {/* Centre: search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <div style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}>
            <Search className="w-4 h-4" aria-hidden={true} />
          </div>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search… (⌘K)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="dark-input"
            style={{ height: '32px', paddingLeft: '34px', paddingRight: '10px' }}
            aria-label="Global search"
          />
        </div>

        {/* Right: notification bell + profile */}
        <div className="flex items-center gap-2">

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              aria-label="Notifications"
              className="flex items-center justify-center rounded-lg transition-colors"
              style={{ width: '28px', height: '28px', color: 'var(--text-muted)', background: 'transparent', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <Bell className="w-4 h-4" aria-hidden={true} />
              {notifications.length > 0 && (
                <span aria-hidden="true" style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--color-danger)',
                  border: '1.5px solid var(--bg-surface)',
                }} />
              )}
            </button>

            {/* Notification panel */}
            {notifOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: '260px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Notifications
                  </p>
                </div>

                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle className="w-5 h-5" style={{ color: 'var(--text-disabled)' }} aria-hidden={true} />
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All clear</p>
                  </div>
                ) : (
                  <div style={{ padding: '6px' }}>
                    {notifications.map((n) => {
                      const Icon = NOTIFICATION_ICONS[n.icon]
                      return (
                        <button
                          key={n.id}
                          onClick={() => { navigate(n.href); setNotifOpen(false) }}
                          className="w-full text-left"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 10px', borderRadius: '8px',
                            background: 'transparent', cursor: 'pointer',
                            transition: 'background 150ms ease-out',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                            background: n.iconBg, color: n.iconColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon className="w-4 h-4" aria-hidden={true} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{n.title}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>{n.subtitle}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile avatar → dropdown */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(o => !o)}
              aria-label="Profile menu"
              className="flex items-center justify-center rounded-full transition-colors"
              style={{
                width: '28px', height: '28px',
                background: avatarColor.bg, color: avatarColor.color,
                fontSize: '11px', fontWeight: 700,
                flexShrink: 0, cursor: 'pointer',
                outline: profileOpen ? '2px solid var(--accent)' : 'none',
                outlineOffset: '2px',
              }}
            >
              {initials}
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: '220px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                overflow: 'hidden',
              }}>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: avatarColor.bg, color: avatarColor.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700,
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {user?.name}
                    </p>
                    <p className="truncate" style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {role?.name ?? 'Staff'}
                    </p>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

                {/* Settings */}
                <div style={{ padding: '6px' }}>
                  <button
                    onClick={() => { navigate('/settings'); setProfileOpen(false) }}
                    className="w-full text-left"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '8px',
                      background: 'transparent', cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      fontSize: '13px', fontWeight: 500,
                      transition: 'background 150ms ease-out',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    <Settings className="w-3.5 h-3.5" aria-hidden={true} />
                    Settings
                  </button>
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

                {/* Sign out */}
                <div style={{ padding: '6px' }}>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '8px',
                      background: 'transparent', cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '13px', fontWeight: 500,
                      transition: 'background 150ms ease-out, color 150ms ease-out',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger-bg)'; e.currentTarget.style.color = 'var(--color-danger)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden={true} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
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
