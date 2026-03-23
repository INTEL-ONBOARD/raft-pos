import {
  LayoutDashboard, ShoppingCart, Package, FolderOpen,
  Warehouse, ClipboardList, Truck, ArrowLeftRight,
  BarChart3, Users, Shield, Settings, CreditCard, LogOut,
  ShoppingBag
} from 'lucide-react'
import { SidebarItem } from './SidebarItem'
import { useAuth } from '../../hooks/useAuth'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { PERMISSIONS } from '@shared/types/permissions'

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

function NavSection({ label }: { label: string }) {
  return (
    <p
      aria-label={`${label} section`}
      style={{
        fontSize: '0.625rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        padding: '16px 20px 4px',
      }}
    >
      {label}
    </p>
  )
}

export function Sidebar() {
  const { user, role, clearAuth, hasPermission } = useAuth()

  async function handleLogout() {
    try { await ipc.invoke(IPC.AUTH_LOGOUT) } finally { clearAuth() }
  }

  const avatarColor = user?.name ? getAvatarColor(user.name) : AVATAR_COLORS[0]
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <div
      className="flex flex-col h-screen w-48 shrink-0"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-4"
        style={{ minHeight: '64px', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-light)',
          }}
        >
          <ShoppingBag className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Raft POS
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
            Point of Sale
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 pt-2 pb-4 overflow-y-auto">
        <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        {hasPermission(PERMISSIONS.CAN_MAKE_SALE) && (
          <SidebarItem to="/orders" icon={ShoppingCart} label="Orders" />
        )}

        <NavSection label="Inventory" />
        {hasPermission(PERMISSIONS.CAN_MANAGE_PRODUCTS) && (
          <SidebarItem to="/products" icon={Package} label="Products" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_CATEGORIES) && (
          <SidebarItem to="/categories" icon={FolderOpen} label="Categories" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_INVENTORY) && (
          <SidebarItem to="/inventory" icon={Warehouse} label="Inventory" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_PURCHASE_ORDERS) && (
          <SidebarItem to="/purchase-orders" icon={ClipboardList} label="Purchase Orders" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_SUPPLIERS) && (
          <SidebarItem to="/suppliers" icon={Truck} label="Suppliers" />
        )}

        <NavSection label="Finance" />
        {hasPermission(PERMISSIONS.CAN_VIEW_REPORTS) && (
          <SidebarItem to="/reporting" icon={BarChart3} label="Reports" />
        )}
        {hasPermission(PERMISSIONS.CAN_OPEN_CLOSE_DRAWER) && (
          <SidebarItem to="/cash-drawer" icon={CreditCard} label="Cash Drawer" />
        )}
        {(hasPermission(PERMISSIONS.CAN_VOID_TRANSACTION) || hasPermission(PERMISSIONS.CAN_REFUND_TRANSACTION) || hasPermission(PERMISSIONS.CAN_REPRINT_RECEIPT)) && (
          <SidebarItem to="/transactions" icon={ArrowLeftRight} label="Transactions" />
        )}

        <NavSection label="Admin" />
        {hasPermission(PERMISSIONS.CAN_MANAGE_USERS) && (
          <SidebarItem to="/users" icon={Users} label="Users" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_ROLES) && (
          <SidebarItem to="/roles" icon={Shield} label="Roles" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_SETTINGS) && (
          <SidebarItem to="/settings" icon={Settings} label="Settings" />
        )}
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-3 flex items-center gap-2.5"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ background: avatarColor.bg, color: avatarColor.color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {user?.name}
          </p>
          <p className="truncate" style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
            {role?.name ?? 'Staff'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="shrink-0 p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
