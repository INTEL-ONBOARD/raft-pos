// src/renderer/src/pages/home/HomePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Package, FolderOpen, Warehouse,
  ClipboardList, Truck, ArrowLeftRight, BarChart3,
  CreditCard, Users, Shield, Settings,
  LayoutDashboard, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { PERMISSIONS } from '@shared/types/permissions'
import type { Permission } from '@shared/types/permissions'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Tile {
  to: string
  icon: React.ElementType
  label: string
  description: string
  accent: string          // primary accent color
  glow: string            // glow color (slightly more saturated)
  gradient: string        // icon bg gradient
  permission?: Permission
  permissionAny?: Permission[]
}

interface TileGroup {
  label: string
  icon: string            // emoji-free: uses a unicode symbol
  tiles: Tile[]
}

// ── Tile definitions ───────────────────────────────────────────────────────────
const TILE_GROUPS: TileGroup[] = [
  {
    label: 'Sales',
    icon: '◈',
    tiles: [
      {
        to: '/orders',
        icon: ShoppingCart,
        label: 'Point of Sale',
        description: 'Process sales & payments',
        accent: '#a78bfa',
        glow: 'rgba(167,139,250,0.35)',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
        permission: PERMISSIONS.CAN_MAKE_SALE,
      },
      {
        to: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        description: 'Revenue overview & KPIs',
        accent: '#38bdf8',
        glow: 'rgba(56,189,248,0.30)',
        gradient: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
      },
      {
        to: '/transactions',
        icon: ArrowLeftRight,
        label: 'Transactions',
        description: 'View, void & refund sales',
        accent: '#818cf8',
        glow: 'rgba(129,140,248,0.30)',
        gradient: 'linear-gradient(135deg, #4338ca 0%, #818cf8 100%)',
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
        accent: '#f87171',
        glow: 'rgba(248,113,113,0.30)',
        gradient: 'linear-gradient(135deg, #b91c1c 0%, #f87171 100%)',
        permission: PERMISSIONS.CAN_OPEN_CLOSE_DRAWER,
      },
    ],
  },
  {
    label: 'Inventory',
    icon: '◇',
    tiles: [
      {
        to: '/products',
        icon: Package,
        label: 'Products',
        description: 'Manage your catalog',
        accent: '#c084fc',
        glow: 'rgba(192,132,252,0.30)',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
        permission: PERMISSIONS.CAN_MANAGE_PRODUCTS,
      },
      {
        to: '/inventory',
        icon: Warehouse,
        label: 'Inventory',
        description: 'Track stock & adjustments',
        accent: '#60a5fa',
        glow: 'rgba(96,165,250,0.30)',
        gradient: 'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)',
        permission: PERMISSIONS.CAN_MANAGE_INVENTORY,
      },
      {
        to: '/categories',
        icon: FolderOpen,
        label: 'Categories',
        description: 'Organise product groups',
        accent: '#fb923c',
        glow: 'rgba(251,146,60,0.30)',
        gradient: 'linear-gradient(135deg, #c2410c 0%, #fb923c 100%)',
        permission: PERMISSIONS.CAN_MANAGE_CATEGORIES,
      },
      {
        to: '/purchase-orders',
        icon: ClipboardList,
        label: 'Purchase Orders',
        description: 'Create & receive orders',
        accent: '#34d399',
        glow: 'rgba(52,211,153,0.30)',
        gradient: 'linear-gradient(135deg, #065f46 0%, #34d399 100%)',
        permission: PERMISSIONS.CAN_MANAGE_PURCHASE_ORDERS,
      },
      {
        to: '/suppliers',
        icon: Truck,
        label: 'Suppliers',
        description: 'Manage supplier contacts',
        accent: '#fbbf24',
        glow: 'rgba(251,191,36,0.30)',
        gradient: 'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
        permission: PERMISSIONS.CAN_MANAGE_SUPPLIERS,
      },
    ],
  },
  {
    label: 'Finance & Reports',
    icon: '◉',
    tiles: [
      {
        to: '/reporting',
        icon: BarChart3,
        label: 'Reports',
        description: 'Sales & performance data',
        accent: '#4ade80',
        glow: 'rgba(74,222,128,0.30)',
        gradient: 'linear-gradient(135deg, #15803d 0%, #4ade80 100%)',
        permission: PERMISSIONS.CAN_VIEW_REPORTS,
      },
    ],
  },
  {
    label: 'Admin',
    icon: '◆',
    tiles: [
      {
        to: '/users',
        icon: Users,
        label: 'Users',
        description: 'Manage staff accounts',
        accent: '#a78bfa',
        glow: 'rgba(167,139,250,0.30)',
        gradient: 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)',
        permission: PERMISSIONS.CAN_MANAGE_USERS,
      },
      {
        to: '/roles',
        icon: Shield,
        label: 'Roles',
        description: 'Permissions & access levels',
        accent: '#2dd4bf',
        glow: 'rgba(45,212,191,0.30)',
        gradient: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)',
        permission: PERMISSIONS.CAN_MANAGE_ROLES,
      },
      {
        to: '/settings',
        icon: Settings,
        label: 'Settings',
        description: 'System & store settings',
        accent: '#94a3b8',
        glow: 'rgba(148,163,184,0.25)',
        gradient: 'linear-gradient(135deg, #334155 0%, #94a3b8 100%)',
        permission: PERMISSIONS.CAN_MANAGE_SETTINGS,
      },
    ],
  },
]

// ── HomePage ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const { user, role, hasPermission } = useAuth()

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting =
    hour < 5  ? 'Good night'     :
    hour < 12 ? 'Good morning'   :
    hour < 17 ? 'Good afternoon' :
                'Good evening'

  // Filter tiles by permission, then filter out empty groups
  const groups = TILE_GROUPS.map((g) => ({
    ...g,
    tiles: g.tiles.filter((t) => {
      if (t.permission)    return hasPermission(t.permission)
      if (t.permissionAny) return t.permissionAny.some((p) => hasPermission(p))
      return true
    }),
  })).filter((g) => g.tiles.length > 0)

  let tileIndex = 0

  return (
    <div
      className="home-dark-root flex flex-col min-h-full"
      style={{
        background: '#080810',
        minHeight: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Ambient radial glows ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 900px 600px at 15% 0%, rgba(124,58,237,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 700px 500px at 85% 10%, rgba(251,191,36,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 600px 400px at 50% 100%, rgba(56,189,248,0.06) 0%, transparent 60%)
        `,
      }} />

      {/* ── Noise texture overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '52px 60px 72px', display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* ── Hero ── */}
        <div className="home-hero" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>

            {/* Left: greeting */}
            <div>
              {/* Role pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(251,191,36,0.10)',
                border: '1px solid rgba(251,191,36,0.20)',
                borderRadius: '999px',
                padding: '4px 12px',
                marginBottom: '20px',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#fbbf24',
                  boxShadow: '0 0 8px rgba(251,191,36,0.8)',
                  display: 'inline-block',
                }} />
                <span style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#fbbf24',
                }}>
                  {role?.name ?? 'Staff'}
                </span>
              </div>

              {/* Name */}
              <h1 style={{
                fontSize: '48px', fontWeight: 800, lineHeight: 1.05,
                letterSpacing: '-0.035em',
                color: '#ffffff',
                marginBottom: '12px',
              }}>
                {greeting},<br />
                <span style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.70) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>{firstName}.</span>
              </h1>

              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.01em' }}>
                Select a module to get started
              </p>
            </div>

            {/* Right: clock */}
            <Clock />
          </div>

          {/* Separator */}
          <div style={{
            marginTop: '40px',
            height: '1px',
            background: 'linear-gradient(to right, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)',
          }} />
        </div>

        {/* ── Groups ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {groups.map((group) => (
            <div key={group.label}>
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.20)', fontWeight: 400 }}>
                  {group.icon}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.10em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)',
                }}>
                  {group.label}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)', marginLeft: '4px' }} />
              </div>

              {/* Grid */}
              <div style={{
                display: 'grid',
                gap: '12px',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              }}>
                {group.tiles.map((tile) => {
                  const delay = 80 + tileIndex++ * 45
                  return (
                    <TileCard
                      key={tile.to}
                      tile={tile}
                      delay={delay}
                      onNavigate={() => navigate(tile.to)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom brand watermark ── */}
        <div style={{
          marginTop: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: 0.15,
        }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
          }} />
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: 'rgba(251,191,36,0.6)',
            marginLeft: '-10px',
          }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase', marginLeft: '6px' }}>
            Raft POS
          </span>
        </div>

      </div>
    </div>
  )
}

// ── Live Clock ─────────────────────────────────────────────────────────────────
function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ textAlign: 'right' }}>
      <p style={{
        fontSize: '36px', fontWeight: 700,
        letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
        color: '#ffffff',
        lineHeight: 1,
      }}>
        {time}
      </p>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '6px', letterSpacing: '0.03em' }}>
        {date}
      </p>
    </div>
  )
}

// ── Tile Card ──────────────────────────────────────────────────────────────────
interface TileCardProps {
  tile: Tile
  delay: number
  onNavigate: () => void
}

function TileCard({ tile, delay, onNavigate }: TileCardProps) {
  const [hovered, setHovered] = useState(false)
  const Icon = tile.icon

  return (
    <button
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="home-tile text-left"
      style={{
        animationDelay: `${delay}ms`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        outline: 'none',
        borderRadius: '20px',
        padding: '22px',
        background: hovered
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hovered
          ? `0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${tile.glow}`
          : '0 1px 2px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: [
          'transform 250ms cubic-bezier(0.22,1,0.36,1)',
          'box-shadow 250ms cubic-bezier(0.22,1,0.36,1)',
          'background 200ms ease-out',
          'border-color 200ms ease-out',
        ].join(', '),
      }}
    >
      {/* Inner glow on hover */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '20px',
        background: hovered
          ? `radial-gradient(ellipse 120% 100% at 0% 0%, ${tile.glow.replace('0.3', '0.15')} 0%, transparent 60%)`
          : 'transparent',
        transition: 'background 300ms ease-out',
        pointerEvents: 'none',
      }} />

      {/* Top shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: '20px', right: '20px',
        height: '1px',
        background: hovered
          ? `linear-gradient(to right, transparent, ${tile.accent}, transparent)`
          : 'transparent',
        transition: 'background 300ms ease-out',
      }} />

      {/* Icon */}
      <div style={{
        width: '46px', height: '46px', borderRadius: '14px',
        background: hovered ? tile.gradient : `${tile.accent}18`,
        border: `1px solid ${hovered ? 'transparent' : `${tile.accent}25`}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '18px',
        boxShadow: hovered ? `0 8px 24px ${tile.glow}` : 'none',
        transition: 'background 250ms ease-out, box-shadow 250ms ease-out, border-color 250ms ease-out',
        position: 'relative', zIndex: 1,
      }}>
        <Icon style={{
          width: '20px', height: '20px',
          color: hovered ? '#ffffff' : tile.accent,
          transition: 'color 200ms ease-out',
        }} />
      </div>

      {/* Label + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', position: 'relative', zIndex: 1 }}>
        <p style={{
          fontSize: '14px', fontWeight: 600,
          color: hovered ? '#ffffff' : 'rgba(255,255,255,0.85)',
          letterSpacing: '-0.01em',
          transition: 'color 200ms ease-out',
        }}>
          {tile.label}
        </p>
        <ChevronRight style={{
          width: '14px', height: '14px',
          color: tile.accent,
          opacity: hovered ? 0.9 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'opacity 200ms ease-out, transform 250ms cubic-bezier(0.22,1,0.36,1)',
          flexShrink: 0,
        }} />
      </div>

      {/* Description */}
      <p style={{
        fontSize: '12px', lineHeight: 1.55,
        color: hovered ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.28)',
        transition: 'color 200ms ease-out',
        position: 'relative', zIndex: 1,
      }}>
        {tile.description}
      </p>
    </button>
  )
}
