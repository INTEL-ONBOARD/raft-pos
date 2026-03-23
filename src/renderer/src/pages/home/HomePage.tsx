// src/renderer/src/pages/home/HomePage.tsx
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Package, FolderOpen, Warehouse,
  ClipboardList, Truck, ArrowLeftRight, BarChart3,
  CreditCard, Users, Shield, Settings,
  LayoutDashboard, ArrowRight
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
  gradient: string
  permission?: Permission
  permissionAny?: Permission[]
}

interface TileGroup {
  label: string
  tiles: Tile[]
}

const TILE_GROUPS: TileGroup[] = [
  {
    label: 'Sales',
    tiles: [
      {
        to: '/orders',
        icon: ShoppingCart,
        label: 'Point of Sale',
        description: 'Process sales & payments',
        color: '#4F46E5',
        gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        permission: PERMISSIONS.CAN_MAKE_SALE,
      },
      {
        to: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        description: 'Revenue overview & KPIs',
        color: '#0891b2',
        gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
      },
      {
        to: '/transactions',
        icon: ArrowLeftRight,
        label: 'Transactions',
        description: 'View, void & refund sales',
        color: '#4338CA',
        gradient: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)',
        permissionAny: [
          PERMISSIONS.CAN_VOID_TRANSACTION,
          PERMISSIONS.CAN_REFUND_TRANSACTION,
          PERMISSIONS.CAN_REPRINT_RECEIPT,
        ],
      },
      {
        to: '/cash-drawer',
        icon: CreditCard,
        label: 'Cash Drawer',
        description: 'Open, close & audit cash',
        color: '#dc2626',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        permission: PERMISSIONS.CAN_OPEN_CLOSE_DRAWER,
      },
    ],
  },
  {
    label: 'Inventory',
    tiles: [
      {
        to: '/products',
        icon: Package,
        label: 'Products',
        description: 'Manage your catalog',
        color: '#7c3aed',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #6D28D9 100%)',
        permission: PERMISSIONS.CAN_MANAGE_PRODUCTS,
      },
      {
        to: '/inventory',
        icon: Warehouse,
        label: 'Inventory',
        description: 'Track stock & adjustments',
        color: '#2563eb',
        gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        permission: PERMISSIONS.CAN_MANAGE_INVENTORY,
      },
      {
        to: '/categories',
        icon: FolderOpen,
        label: 'Categories',
        description: 'Organise product groups',
        color: '#c2410c',
        gradient: 'linear-gradient(135deg, #c2410c 0%, #b45309 100%)',
        permission: PERMISSIONS.CAN_MANAGE_CATEGORIES,
      },
      {
        to: '/purchase-orders',
        icon: ClipboardList,
        label: 'Purchase Orders',
        description: 'Create & receive orders',
        color: '#0369a1',
        gradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
        permission: PERMISSIONS.CAN_MANAGE_PURCHASE_ORDERS,
      },
      {
        to: '/suppliers',
        icon: Truck,
        label: 'Suppliers',
        description: 'Manage supplier contacts',
        color: '#b45309',
        gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
        permission: PERMISSIONS.CAN_MANAGE_SUPPLIERS,
      },
    ],
  },
  {
    label: 'Finance & Reports',
    tiles: [
      {
        to: '/reporting',
        icon: BarChart3,
        label: 'Reports',
        description: 'Sales & performance data',
        color: '#15803d',
        gradient: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
        permission: PERMISSIONS.CAN_VIEW_REPORTS,
      },
    ],
  },
  {
    label: 'Admin',
    tiles: [
      {
        to: '/users',
        icon: Users,
        label: 'Users',
        description: 'Manage staff accounts',
        color: '#6d28d9',
        gradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
        permission: PERMISSIONS.CAN_MANAGE_USERS,
      },
      {
        to: '/roles',
        icon: Shield,
        label: 'Roles',
        description: 'Permissions & access levels',
        color: '#0d9488',
        gradient: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
        permission: PERMISSIONS.CAN_MANAGE_ROLES,
      },
      {
        to: '/settings',
        icon: Settings,
        label: 'Settings',
        description: 'System & store settings',
        color: '#374151',
        gradient: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
        permission: PERMISSIONS.CAN_MANAGE_SETTINGS,
      },
    ],
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, role, hasPermission } = useAuth()

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting =
    hour < 5 ? 'Good night' :
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening'

  // Filter tiles by permission, then filter out empty groups
  const groups = TILE_GROUPS.map((g) => ({
    ...g,
    tiles: g.tiles.filter((t) => {
      if (t.permission) return hasPermission(t.permission)
      if (t.permissionAny) return t.permissionAny.some((p) => hasPermission(p))
      return true
    }),
  })).filter((g) => g.tiles.length > 0)

  // Flat index for stagger delay
  let tileIndex = 0

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: 'var(--bg-base)', padding: '48px 56px 64px' }}
    >
      {/* ── Hero header ── */}
      <div className="home-header mb-12" style={{ animationDelay: '0ms' }}>
        <div className="flex items-end justify-between">
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
              {role?.name ?? 'Staff'}
            </p>
            <h1 style={{ fontSize: '40px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {greeting},<br />{firstName} 👋
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginTop: '10px' }}>
              Select a module to get started
            </p>
          </div>

          {/* Live clock */}
          <Clock />
        </div>

        {/* Divider */}
        <div style={{ marginTop: '32px', height: '1px', background: 'var(--border-subtle)' }} />
      </div>

      {/* ── Grouped tile sections ── */}
      <div className="flex flex-col gap-10">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Section label */}
            <p
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '16px',
              }}
            >
              {group.label}
            </p>

            {/* Tiles */}
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}
            >
              {group.tiles.map((tile) => {
                const delay = 60 + tileIndex++ * 40
                const Icon = tile.icon
                return (
                  <TileCard
                    key={tile.to}
                    tile={tile}
                    delay={delay}
                    onNavigate={() => navigate(tile.to)}
                    Icon={Icon}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Live Clock ────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="text-right" style={{ opacity: 0.9 }}>
      <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
        {time}
      </p>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
        {date}
      </p>
    </div>
  )
}

// ── Tile Card ─────────────────────────────────────────────────────────────────
interface TileCardProps {
  tile: Tile
  delay: number
  onNavigate: () => void
  Icon: React.ElementType
}

function TileCard({ tile, delay, onNavigate, Icon }: TileCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="home-tile text-left"
      style={{
        animationDelay: `${delay}ms`,
        background: hovered ? '#ffffff' : '#ffffff',
        border: `1px solid ${hovered ? tile.color + '30' : 'var(--border-subtle)'}`,
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        outline: 'none',
        boxShadow: hovered
          ? `0 8px 32px ${tile.color}20, 0 2px 8px ${tile.color}10`
          : '0 1px 3px rgba(17,24,39,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 200ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms cubic-bezier(0.22,1,0.36,1), border-color 150ms ease-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top gradient accent on hover */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: tile.gradient,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 200ms ease-out',
        }}
      />

      {/* Icon circle */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: hovered ? tile.gradient : `${tile.color}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          transition: 'background 200ms ease-out',
          boxShadow: hovered ? `0 4px 12px ${tile.color}30` : 'none',
        }}
      >
        <Icon
          style={{
            width: '20px',
            height: '20px',
            color: hovered ? '#ffffff' : tile.color,
            transition: 'color 200ms ease-out',
          }}
        />
      </div>

      {/* Label + arrow */}
      <div className="flex items-center justify-between mb-1.5">
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {tile.label}
        </p>
        <ArrowRight
          style={{
            width: '14px',
            height: '14px',
            color: tile.color,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
            transition: 'opacity 180ms ease-out, transform 200ms cubic-bezier(0.22,1,0.36,1)',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Description */}
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {tile.description}
      </p>
    </button>
  )
}
