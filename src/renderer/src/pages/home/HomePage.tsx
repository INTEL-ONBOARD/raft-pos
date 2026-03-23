// src/renderer/src/pages/home/HomePage.tsx
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Package, FolderOpen, Warehouse,
  ClipboardList, Truck, ArrowLeftRight, BarChart3,
  CreditCard, Users, Shield, Settings,
  LayoutDashboard
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { PERMISSIONS } from '@shared/types/permissions'
import type { Permission } from '@shared/types/permissions'

interface Tile {
  to: string
  icon: React.ElementType
  label: string
  description: string
  color: string
  iconBg: string
  permission?: Permission
  permissionAny?: Permission[]
}

const ALL_TILES: Tile[] = [
  {
    to: '/orders',
    icon: ShoppingCart,
    label: 'Point of Sale',
    description: 'Process sales and payments',
    color: '#4F46E5',
    iconBg: 'rgba(79,70,229,0.10)',
    permission: PERMISSIONS.CAN_MAKE_SALE,
  },
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Sales overview and KPIs',
    color: '#0d9488',
    iconBg: 'rgba(13,148,136,0.10)',
  },
  {
    to: '/products',
    icon: Package,
    label: 'Products',
    description: 'Manage your product catalog',
    color: '#7c3aed',
    iconBg: 'rgba(124,58,237,0.10)',
    permission: PERMISSIONS.CAN_MANAGE_PRODUCTS,
  },
  {
    to: '/inventory',
    icon: Warehouse,
    label: 'Inventory',
    description: 'Track stock levels and adjustments',
    color: '#2563eb',
    iconBg: 'rgba(37,99,235,0.10)',
    permission: PERMISSIONS.CAN_MANAGE_INVENTORY,
  },
  {
    to: '/categories',
    icon: FolderOpen,
    label: 'Categories',
    description: 'Organise product categories',
    color: '#c2410c',
    iconBg: 'rgba(194,65,12,0.10)',
    permission: PERMISSIONS.CAN_MANAGE_CATEGORIES,
  },
  {
    to: '/purchase-orders',
    icon: ClipboardList,
    label: 'Purchase Orders',
    description: 'Create and receive orders',
    color: '#0369a1',
    iconBg: 'rgba(3,105,161,0.10)',
    permission: PERMISSIONS.CAN_MANAGE_PURCHASE_ORDERS,
  },
  {
    to: '/suppliers',
    icon: Truck,
    label: 'Suppliers',
    description: 'Manage supplier contacts',
    color: '#b45309',
    iconBg: 'rgba(180,83,9,0.10)',
    permission: PERMISSIONS.CAN_MANAGE_SUPPLIERS,
  },
  {
    to: '/transactions',
    icon: ArrowLeftRight,
    label: 'Transactions',
    description: 'View, void and refund sales',
    color: '#4338CA',
    iconBg: 'rgba(67,56,202,0.10)',
    permissionAny: [
      PERMISSIONS.CAN_VOID_TRANSACTION,
      PERMISSIONS.CAN_REFUND_TRANSACTION,
      PERMISSIONS.CAN_REPRINT_RECEIPT,
    ],
  },
  {
    to: '/reporting',
    icon: BarChart3,
    label: 'Reports',
    description: 'Sales and performance reports',
    color: '#15803d',
    iconBg: 'rgba(21,128,61,0.10)',
    permission: PERMISSIONS.CAN_VIEW_REPORTS,
  },
  {
    to: '/cash-drawer',
    icon: CreditCard,
    label: 'Cash Drawer',
    description: 'Open, close and audit cash',
    color: '#dc2626',
    iconBg: 'rgba(220,38,38,0.10)',
    permission: PERMISSIONS.CAN_OPEN_CLOSE_DRAWER,
  },
  {
    to: '/users',
    icon: Users,
    label: 'Users',
    description: 'Manage staff accounts',
    color: '#6d28d9',
    iconBg: 'rgba(109,40,217,0.10)',
    permission: PERMISSIONS.CAN_MANAGE_USERS,
  },
  {
    to: '/roles',
    icon: Shield,
    label: 'Roles',
    description: 'Configure permissions and roles',
    color: '#0d9488',
    iconBg: 'rgba(13,148,136,0.10)',
    permission: PERMISSIONS.CAN_MANAGE_ROLES,
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Settings',
    description: 'System and store settings',
    color: '#4b5563',
    iconBg: 'rgba(75,85,99,0.10)',
    permission: PERMISSIONS.CAN_MANAGE_SETTINGS,
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, role, hasPermission } = useAuth()

  const tiles = ALL_TILES.filter((t) => {
    if (t.permission) return hasPermission(t.permission)
    if (t.permissionAny) return t.permissionAny.some((p) => hasPermission(p))
    return true
  })

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div
      className="flex flex-col min-h-screen p-8"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header */}
      <div className="mb-10">
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {greeting}, {firstName}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {role?.name ?? 'Staff'} · What would you like to do?
        </p>
      </div>

      {/* Tile grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <button
              key={tile.to}
              onClick={() => navigate(tile.to)}
              className="text-left transition-all rounded-2xl p-5 active:scale-[0.97]"
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = tile.color + '40'
                el.style.boxShadow = `0 4px 16px ${tile.color}18, var(--shadow-sm)`
                el.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = 'var(--border-subtle)'
                el.style.boxShadow = 'var(--shadow-sm)'
                el.style.transform = 'none'
              }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: tile.iconBg }}
              >
                <Icon className="w-5 h-5" style={{ color: tile.color }} />
              </div>

              {/* Label */}
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {tile.label}
              </p>

              {/* Description */}
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {tile.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
