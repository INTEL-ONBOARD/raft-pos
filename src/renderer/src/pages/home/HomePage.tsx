// src/renderer/src/pages/home/HomePage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCartIcon,
  CubeIcon,
  FolderOpenIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ArrowsRightLeftIcon,
  ChartBarSquareIcon,
  CreditCardIcon,
  UsersIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  BoltIcon,
  Square3Stack3DIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'
import { useDashboard } from '../../hooks/useDashboard'
import { useCashDrawer } from '../../hooks/useCashDrawer'
import { useInventory } from '../../hooks/useInventory'
import { PERMISSIONS } from '@shared/types/permissions'
import type { Permission } from '@shared/types/permissions'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Tile {
  to: string
  icon: React.ElementType
  label: string
  description: string
  accent: string // primary accent color
  glow: string // glow color (slightly more saturated)
  gradient: string // icon bg gradient
  permission?: Permission
  permissionAny?: Permission[]
}

interface TileGroup {
  label: string
  icon: string // emoji-free: uses a unicode symbol
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
        icon: ShoppingCartIcon,
        label: 'Point of Sale',
        description: 'Process sales & payments',
        accent: '#a78bfa',
        glow: 'rgba(167,139,250,0.35)',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
        permission: PERMISSIONS.CAN_MAKE_SALE
      },
      {
        to: '/dashboard',
        icon: Squares2X2Icon,
        label: 'Dashboard',
        description: 'Revenue overview & KPIs',
        accent: '#38bdf8',
        glow: 'rgba(56,189,248,0.30)',
        gradient: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)'
      },
      {
        to: '/transactions',
        icon: ArrowsRightLeftIcon,
        label: 'Transactions',
        description: 'View, void & refund sales',
        accent: '#818cf8',
        glow: 'rgba(129,140,248,0.30)',
        gradient: 'linear-gradient(135deg, #4338ca 0%, #818cf8 100%)',
        permissionAny: [
          PERMISSIONS.CAN_VOID_TRANSACTION,
          PERMISSIONS.CAN_REFUND_TRANSACTION,
          PERMISSIONS.CAN_REPRINT_RECEIPT
        ]
      },
      {
        to: '/cash-drawer',
        icon: CreditCardIcon,
        label: 'Cash Drawer',
        description: 'Open, close & audit cash',
        accent: '#f87171',
        glow: 'rgba(248,113,113,0.30)',
        gradient: 'linear-gradient(135deg, #b91c1c 0%, #f87171 100%)',
        permission: PERMISSIONS.CAN_OPEN_CLOSE_DRAWER
      }
    ]
  },
  {
    label: 'Inventory',
    icon: '◇',
    tiles: [
      {
        to: '/products',
        icon: CubeIcon,
        label: 'Products',
        description: 'Manage your catalog',
        accent: '#c084fc',
        glow: 'rgba(192,132,252,0.30)',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
        permission: PERMISSIONS.CAN_MANAGE_PRODUCTS
      },
      {
        to: '/inventory',
        icon: BuildingStorefrontIcon,
        label: 'Inventory',
        description: 'Track stock & adjustments',
        accent: '#60a5fa',
        glow: 'rgba(96,165,250,0.30)',
        gradient: 'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)',
        permission: PERMISSIONS.CAN_MANAGE_INVENTORY
      },
      {
        to: '/categories',
        icon: FolderOpenIcon,
        label: 'Categories',
        description: 'Organise product groups',
        accent: '#fb923c',
        glow: 'rgba(251,146,60,0.30)',
        gradient: 'linear-gradient(135deg, #c2410c 0%, #fb923c 100%)',
        permission: PERMISSIONS.CAN_MANAGE_CATEGORIES
      },
      {
        to: '/purchase-orders',
        icon: ClipboardDocumentListIcon,
        label: 'Purchase Orders',
        description: 'Create & receive orders',
        accent: '#34d399',
        glow: 'rgba(52,211,153,0.30)',
        gradient: 'linear-gradient(135deg, #065f46 0%, #34d399 100%)',
        permission: PERMISSIONS.CAN_MANAGE_PURCHASE_ORDERS
      },
      {
        to: '/suppliers',
        icon: TruckIcon,
        label: 'Suppliers',
        description: 'Manage supplier contacts',
        accent: '#fbbf24',
        glow: 'rgba(251,191,36,0.30)',
        gradient: 'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
        permission: PERMISSIONS.CAN_MANAGE_SUPPLIERS
      }
    ]
  },
  {
    label: 'Finance & Reports',
    icon: '◉',
    tiles: [
      {
        to: '/reporting',
        icon: ChartBarSquareIcon,
        label: 'Reports',
        description: 'Sales & performance data',
        accent: '#4ade80',
        glow: 'rgba(74,222,128,0.30)',
        gradient: 'linear-gradient(135deg, #15803d 0%, #4ade80 100%)',
        permission: PERMISSIONS.CAN_VIEW_REPORTS
      }
    ]
  },
  {
    label: 'Admin',
    icon: '◆',
    tiles: [
      {
        to: '/users',
        icon: UsersIcon,
        label: 'Users',
        description: 'Manage staff accounts',
        accent: '#a78bfa',
        glow: 'rgba(167,139,250,0.30)',
        gradient: 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)',
        permission: PERMISSIONS.CAN_MANAGE_USERS
      },
      {
        to: '/roles',
        icon: ShieldCheckIcon,
        label: 'Roles',
        description: 'Permissions & access levels',
        accent: '#2dd4bf',
        glow: 'rgba(45,212,191,0.30)',
        gradient: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)',
        permission: PERMISSIONS.CAN_MANAGE_ROLES
      },
      {
        to: '/settings',
        icon: Cog6ToothIcon,
        label: 'Settings',
        description: 'System & store settings',
        accent: '#94a3b8',
        glow: 'rgba(148,163,184,0.25)',
        gradient: 'linear-gradient(135deg, #334155 0%, #94a3b8 100%)',
        permission: PERMISSIONS.CAN_MANAGE_SETTINGS
      }
    ]
  }
]

// ── HomePage ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()
  const { user, role, hasPermission } = useAuth()
  const { data: stats } = useDashboard()
  const { openDrawerQuery } = useCashDrawer()
  const { stockQuery } = useInventory()
  const drawer = openDrawerQuery.data
  const openedAt = drawer?.openedAt ?? null

  // Drawer open duration (live tick)
  const [drawerDuration, setDrawerDuration] = useState('')
  useEffect(() => {
    if (!openedAt) {
      setDrawerDuration('')
      return
    }
    const startedAt = openedAt
    function update() {
      const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      setDrawerDuration(h > 0 ? `${h}h ${m}m open` : `${m}m open`)
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [openedAt])

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting =
    hour < 5
      ? 'Good night'
      : hour < 12
        ? 'Good morning'
        : hour < 17
          ? 'Good afternoon'
          : 'Good evening'

  const groups = TILE_GROUPS.map((g) => ({
    ...g,
    tiles: g.tiles.filter((t) => {
      if (t.permission) return hasPermission(t.permission)
      if (t.permissionAny) return t.permissionAny.some((p) => hasPermission(p))
      return true
    })
  })).filter((g) => g.tiles.length > 0)

  const lowStockCount = stats?.lowStockItems?.length ?? 0
  const drawerOpen = drawer?.status === 'open'

  // Flat stagger index across all groups
  let flatIndex = 0

  return (
    <div
      className="home-dark-root"
      style={{
        background: '#080810',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* ── Ambient radial glows ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: `
          radial-gradient(ellipse 900px 600px at 15% 0%, rgba(124,58,237,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 700px 500px at 85% 10%, rgba(251,191,36,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 600px 400px at 50% 100%, rgba(56,189,248,0.06) 0%, transparent 60%)
        `
        }}
      />

      {/* ── Noise texture overlay ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      {/* ── Main layout ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 40px 32px',
          overflow: 'hidden'
        }}
      >
        {/* ── Hero: single compact line ── */}
        <div
          className="home-hero"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Role pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(251,191,36,0.10)',
                border: '1px solid rgba(251,191,36,0.20)',
                borderRadius: '999px',
                padding: '4px 12px',
                flexShrink: 0
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#fbbf24',
                  boxShadow: '0 0 8px rgba(251,191,36,0.8)',
                  display: 'inline-block'
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#fbbf24'
                }}
              >
                {role?.name ?? 'Staff'}
              </span>
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                margin: 0
              }}
            >
              {greeting},{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.65) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {firstName}.
              </span>
            </h1>
          </div>
          <Clock />
        </div>

        {/* ── Body: left (bento groups) + right (info panel card) ── */}
        <div style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden', minHeight: 0 }}>
          {/* ── Left column: all groups ── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              minWidth: 0,
              overflowY: 'auto'
            }}
          >
            {groups.map((group) => (
              <div key={group.label}>
                {/* Group label row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.22)',
                      flexShrink: 0
                    }}
                  >
                    {group.label}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                </div>
                {/* Tile grid */}
                <div
                  style={{
                    display: 'grid',
                    gap: '10px',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
                    gridAutoRows: '130px'
                  }}
                >
                  {group.tiles.map((tile) => {
                    const delay = flatIndex++ * 35
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

          {/* ── Right info panel: solid card ── */}
          <div
            style={{
              width: '260px',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* ── TODAY section ── */}
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.22)',
                marginBottom: '2px'
              }}
            >
              Today
            </p>

            <InfoCard
              icon={<ArrowTrendingUpIcon style={{ width: 15, height: 15 }} />}
              iconColor="#4ade80"
              iconBg="rgba(74,222,128,0.12)"
              label="Revenue"
              value={
                stats
                  ? `₱${(stats.todayRevenue ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                  : '—'
              }
              sub={stats ? `${stats.todayTransactions ?? 0} transactions` : 'Loading...'}
              subColor="rgba(74,222,128,0.65)"
            />

            <InfoCard
              icon={<BoltIcon style={{ width: 15, height: 15 }} />}
              iconColor="#60a5fa"
              iconBg="rgba(96,165,250,0.12)"
              label="Avg. Order Value"
              value={
                stats
                  ? `₱${(stats.averageOrderValue ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                  : '—'
              }
              sub={stats ? `${stats.todayItemsSold ?? 0} items sold` : 'Loading...'}
              subColor="rgba(96,165,250,0.65)"
            />

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

            {/* ── STORE section ── */}
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.22)',
                marginBottom: '2px'
              }}
            >
              Store
            </p>

            <InfoCard
              icon={<BanknotesIcon style={{ width: 15, height: 15 }} />}
              iconColor={drawerOpen ? '#4ade80' : '#f87171'}
              iconBg={drawerOpen ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.10)'}
              label="Cash Drawer"
              value={drawerOpen ? 'Open' : 'Closed'}
              sub={drawerOpen ? drawerDuration || 'Just opened' : 'No drawer open'}
              subColor={drawerOpen ? 'rgba(74,222,128,0.65)' : 'rgba(248,113,113,0.55)'}
              valueColor={drawerOpen ? '#4ade80' : '#f87171'}
              onClick={() => navigate('/cash-drawer')}
            />

            <InfoCard
              icon={<ExclamationTriangleIcon style={{ width: 15, height: 15 }} />}
              iconColor={lowStockCount > 0 ? '#fbbf24' : '#4ade80'}
              iconBg={lowStockCount > 0 ? 'rgba(251,191,36,0.12)' : 'rgba(74,222,128,0.10)'}
              label="Low Stock"
              value={lowStockCount > 0 ? `${lowStockCount} items` : 'All good'}
              sub={lowStockCount > 0 ? 'Needs restocking' : 'Levels healthy'}
              subColor={lowStockCount > 0 ? 'rgba(251,191,36,0.65)' : 'rgba(74,222,128,0.55)'}
              valueColor={lowStockCount > 0 ? '#fbbf24' : '#4ade80'}
              onClick={lowStockCount > 0 ? () => navigate('/inventory') : undefined}
            />

            {(() => {
              const stockRows = stockQuery.data ?? []
              const totalProducts = stockRows.length
              const totalUnits = stockRows.reduce((sum, r) => sum + r.quantity, 0)
              return (
                <InfoCard
                  icon={<Square3Stack3DIcon style={{ width: 15, height: 15 }} />}
                  iconColor="#c084fc"
                  iconBg="rgba(192,132,252,0.12)"
                  label="Inventory"
                  value={`${totalProducts} products`}
                  sub={`${totalUnits.toLocaleString()} units total`}
                  subColor="rgba(192,132,252,0.65)"
                  onClick={() => navigate('/inventory')}
                />
              )
            })()}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

            {/* ── TOP SELLERS section ── always visible ── */}
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.22)',
                marginBottom: '6px',
                flexShrink: 0
              }}
            >
              Top Sellers Today
            </p>

            {stats?.topSellers && stats.topSellers.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flex: 1,
                  overflow: 'hidden'
                }}
              >
                {stats.topSellers.slice(0, 4).map((item, i) => (
                  <div
                    key={item.productId}
                    style={{ display: 'flex', alignItems: 'center', gap: '9px' }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '5px',
                        flexShrink: 0,
                        background:
                          i === 0
                            ? 'rgba(251,191,36,0.15)'
                            : i === 1
                              ? 'rgba(148,163,184,0.12)'
                              : 'rgba(251,146,60,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 700,
                        color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#fb923c'
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.72)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.name}
                      </p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)' }}>
                        {item.unitsSold} sold
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.50)',
                        flexShrink: 0
                      }}
                    >
                      ₱{(item.revenue ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px 0'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ClockIcon style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.18)' }} />
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.28)',
                    textAlign: 'center',
                    lineHeight: 1.5
                  }}
                >
                  No sales yet today
                </p>
                <button
                  onClick={() => navigate('/orders')}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(99,102,241,0.85)',
                    background: 'rgba(99,102,241,0.10)',
                    border: '1px solid rgba(99,102,241,0.20)',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    cursor: 'pointer',
                    transition: 'background 150ms ease-out'
                  }}
                >
                  Start a sale →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Info Card ──────────────────────────────────────────────────────────────────
interface InfoCardProps {
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  label: string
  value: string
  sub: string
  subColor: string
  valueColor?: string
  onClick?: () => void
}

function InfoCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  subColor,
  valueColor,
  onClick
}: InfoCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '10px',
        padding: '10px 4px',
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        cursor: onClick ? 'pointer' : 'default',
        background: hovered && onClick ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 180ms ease-out',
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '9px',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          flexShrink: 0
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.28)',
            marginBottom: '1px',
            fontWeight: 500
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: valueColor ?? '#ffffff',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}
        >
          {value}
        </p>
        <p style={{ fontSize: '10px', color: subColor, marginTop: '1px' }}>{sub}</p>
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

  const time = now.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const date = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ textAlign: 'right' }}>
      <p
        style={{
          fontSize: '36px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
          color: '#ffffff',
          lineHeight: 1
        }}
      >
        {time}
      </p>
      <p
        style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.35)',
          marginTop: '6px',
          letterSpacing: '0.03em'
        }}
      >
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
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hovered
          ? `0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${tile.glow}`
          : '0 1px 2px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: [
          'transform 250ms cubic-bezier(0.22,1,0.36,1)',
          'box-shadow 250ms cubic-bezier(0.22,1,0.36,1)',
          'background 200ms ease-out',
          'border-color 200ms ease-out'
        ].join(', ')
      }}
    >
      {/* Inner glow on hover */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '16px',
          background: hovered
            ? `radial-gradient(ellipse 120% 100% at 0% 0%, ${tile.glow.replace('0.3', '0.15')} 0%, transparent 60%)`
            : 'transparent',
          transition: 'background 300ms ease-out',
          pointerEvents: 'none'
        }}
      />

      {/* Top shimmer line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '16px',
          right: '16px',
          height: '1px',
          background: hovered
            ? `linear-gradient(to right, transparent, ${tile.accent}, transparent)`
            : 'transparent',
          transition: 'background 300ms ease-out'
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '11px',
          background: hovered ? tile.gradient : `${tile.accent}18`,
          border: `1px solid ${hovered ? 'transparent' : `${tile.accent}25`}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px',
          boxShadow: hovered ? `0 6px 18px ${tile.glow}` : 'none',
          transition:
            'background 250ms ease-out, box-shadow 250ms ease-out, border-color 250ms ease-out',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Icon
          style={{
            width: '17px',
            height: '17px',
            color: hovered ? '#ffffff' : tile.accent,
            transition: 'color 200ms ease-out'
          }}
        />
      </div>

      {/* Label + chevron */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: hovered ? '#ffffff' : 'rgba(255,255,255,0.85)',
            letterSpacing: '-0.01em',
            transition: 'color 200ms ease-out'
          }}
        >
          {tile.label}
        </p>
        <ChevronRightIcon
          style={{
            width: '13px',
            height: '13px',
            color: tile.accent,
            opacity: hovered ? 0.9 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
            transition: 'opacity 200ms ease-out, transform 250ms cubic-bezier(0.22,1,0.36,1)',
            flexShrink: 0
          }}
        />
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '11px',
          lineHeight: 1.5,
          color: hovered ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.26)',
          transition: 'color 200ms ease-out',
          position: 'relative',
          zIndex: 1
        }}
      >
        {tile.description}
      </p>
    </button>
  )
}
