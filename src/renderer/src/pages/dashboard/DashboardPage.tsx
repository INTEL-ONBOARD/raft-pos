// src/renderer/src/pages/dashboard/DashboardPage.tsx
import { useState } from 'react'
import {
  TrendingUp, ShoppingCart, Package, BarChart2,
  AlertTriangle, CheckCircle2, ArrowRight,
  RefreshCw, Box, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useDashboard } from '../../hooks/useDashboard'
import { useAuthStore } from '../../stores/auth.store'
import type { TopSellerItem, LowStockItem } from '@shared/types/dashboard.types'

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return fmt(n)
}

// ─── KPI Card (matches reference: label + big value + delta badge) ───────────
interface KPICardProps {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: string
  delta?: string
  deltaUp?: boolean
  accent: string
}

function KPICard({ icon, iconBg, iconColor, label, value, delta, deltaUp, accent }: KPICardProps) {
  return (
    <div
      className="content-card flex flex-col gap-2 p-5 relative overflow-hidden"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      {/* subtle top glow */}
      <div
        className="absolute inset-x-0 top-0 h-10 pointer-events-none"
        style={{ background: `linear-gradient(180deg, ${accent}1a 0%, transparent 100%)` }}
      />
      <div className="flex items-center justify-between relative">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        {delta && (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: deltaUp ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.10)',
              color: deltaUp ? '#15803d' : '#dc2626'
            }}
          >
            {deltaUp
              ? <ArrowUpRight className="w-3 h-3" />
              : <ArrowDownRight className="w-3 h-3" />
            }
            {delta}
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(15,17,23,0.42)' }}>
          {label}
        </p>
        <p
          className="mt-0.5 leading-tight tabular-nums"
          style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Catmull-Rom bezier helper ────────────────────────────────────────────────
function catmullRom(points: [number, number][]): string {
  if (points.length < 2) return ''
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
  }
  return d
}

// ─── Revenue Sparkline (SVG, no lib needed) ──────────────────────────────────
function RevenueTrendPanel({ revenue, transactions, avgOrder }: {
  revenue: number
  transactions: number
  avgOrder: number
}) {
  // Generate a plausible intra-day distribution from today's total revenue
  // Spread across 7 hourly buckets (9am–3pm typical retail hours)
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm']
  const weights = [0.06, 0.11, 0.16, 0.22, 0.19, 0.15, 0.11]
  const points = weights.map(w => Math.round(w * revenue))

  const W = 480
  const H = 140
  const pad = { t: 12, b: 24, l: 8, r: 8 }
  const maxVal = Math.max(...points, 1)
  const xs = points.map((_, i) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r))
  const ys = points.map(v => pad.t + (1 - v / maxVal) * (H - pad.t - pad.b))

  const pts: [number, number][] = xs.map((x, i) => [x, ys[i]])
  const linePath = catmullRom(pts)
  const areaPath = linePath
    + ` L${xs[xs.length - 1]},${H - pad.b} L${xs[0]},${H - pad.b} Z`

  const isPositive = revenue > 0

  return (
    <div className="content-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(15,17,23,0.07)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(15,17,23,0.40)' }}>
            Revenue Trend
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(15,17,23,0.30)' }}>
            Today — estimated hourly distribution
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums" style={{ color: '#0f1117' }}>₱{fmtCompact(revenue)}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(15,17,23,0.38)' }}>total today</p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="px-4 pt-4 pb-2">
        <svg viewBox={`0 0 ${W} 140`} className="w-full" style={{ height: 140 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" />
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={isPositive ? '#4F46E5' : 'rgba(15,17,23,0.15)'}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Dots */}
          {xs.map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={ys[i]}
              r="3"
              fill="#4F46E5"
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}
          {/* X-axis labels */}
          {hours.map((h, i) => (
            <text
              key={h}
              x={xs[i]}
              y={H - 4}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(15,17,23,0.32)"
              fontFamily="Inter, sans-serif"
            >
              {h}
            </text>
          ))}
        </svg>
      </div>

      {/* Bottom stat row */}
      <div
        className="grid grid-cols-3 divide-x mt-auto"
        style={{ borderTop: '1px solid rgba(15,17,23,0.07)', borderColor: 'rgba(15,17,23,0.07)' }}
      >
        {[
          { label: 'Transactions', value: String(transactions) },
          { label: 'Avg Order', value: `₱${fmtCompact(avgOrder)}` },
          { label: 'Revenue/Txn', value: transactions > 0 ? `₱${fmtCompact(revenue / transactions)}` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center py-3 gap-0.5" style={{ borderColor: 'rgba(15,17,23,0.07)' }}>
            <span className="text-xs" style={{ color: 'rgba(15,17,23,0.38)' }}>{label}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: '#0f1117' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Rank badge style helper ──────────────────────────────────────────────────
const rankStyle = (rank: number) => {
  if (rank === 1) return { bg: 'var(--rank-gold-bg)', color: 'var(--rank-gold)' }
  if (rank === 2) return { bg: 'var(--rank-silver-bg)', color: 'var(--rank-silver)' }
  if (rank === 3) return { bg: 'var(--rank-bronze-bg)', color: 'var(--rank-bronze)' }
  return { bg: 'var(--badge-gray-bg)', color: 'var(--badge-gray-text)' }
}

// ─── Best Sellers Table (matches reference layout) ───────────────────────────
function BestSellersPanel({ items }: { items: TopSellerItem[] }) {
  const maxRevenue = Math.max(...items.map(s => s.revenue), 1)
  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0)

  return (
    <div className="content-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(15,17,23,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(217,119,6,0.10)' }}
          >
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#b45309' }} />
          </div>
          <span className="text-sm font-bold" style={{ color: '#0f1117' }}>Best selling products</span>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,119,6,0.10)', color: '#b45309' }}>
            {items.length} tracked
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 flex-1">
          <TrendingUp className="w-8 h-8" style={{ color: 'rgba(15,17,23,0.12)' }} />
          <p className="text-sm" style={{ color: 'rgba(15,17,23,0.38)' }}>No sales yet today</p>
          <p className="text-xs" style={{ color: 'rgba(15,17,23,0.25)' }}>Process a transaction to see top products here</p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div
            className="grid px-5 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{
              gridTemplateColumns: '28px 1fr 90px 64px',
              color: 'rgba(15,17,23,0.38)',
              borderBottom: '1px solid rgba(15,17,23,0.05)',
              background: 'rgba(15,17,23,0.02)'
            }}
          >
            <span>#</span>
            <span>Product</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Sales</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.map((item, i) => {
              return (
                <div
                  key={item.productId}
                  className="grid items-start px-5 py-3"
                  style={{
                    gridTemplateColumns: '28px 1fr 90px 64px',
                    borderBottom: '1px solid rgba(15,17,23,0.05)'
                  }}
                >
                  {/* Rank badge */}
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: rankStyle(i + 1).bg, color: rankStyle(i + 1).color }}
                  >
                    {i + 1}
                  </span>

                  {/* Name + progress bar */}
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0f1117' }}>{item.name}</p>
                    {/* Revenue progress bar */}
                    <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0}%`,
                          background: 'var(--accent)',
                          opacity: 0.6
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono mt-0.5 block" style={{ color: 'rgba(15,17,23,0.28)' }}>
                      {item.sku}
                    </span>
                  </div>

                  {/* Revenue */}
                  <span className="text-sm font-bold tabular-nums text-right" style={{ color: '#0f1117' }}>
                    ₱{fmtCompact(item.revenue)}
                  </span>

                  {/* Units */}
                  <span className="text-sm tabular-nums text-right" style={{ color: 'rgba(15,17,23,0.50)' }}>
                    {item.unitsSold}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid rgba(15,17,23,0.07)', background: 'rgba(15,17,23,0.02)' }}
          >
            <span className="text-xs" style={{ color: 'rgba(15,17,23,0.35)' }}>
              Top {items.length} products today
            </span>
            <span className="text-sm font-bold tabular-nums" style={{ color: '#0f1117' }}>₱{fmt(totalRevenue)}</span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Stock Alerts Panel ───────────────────────────────────────────────────────
function StockAlertsPanel({ items }: { items: LowStockItem[] }) {
  const critical = items.filter(i => i.quantity <= 0)
  const low = items.filter(i => i.quantity > 0)

  return (
    <div className="content-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(15,17,23,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: critical.length > 0 ? 'rgba(220,38,38,0.10)' : 'rgba(217,119,6,0.10)' }}
          >
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: critical.length > 0 ? '#dc2626' : '#b45309' }} />
          </div>
          <span className="text-sm font-bold" style={{ color: '#0f1117' }}>Stock Alerts</span>
        </div>
        <div className="flex items-center gap-1.5">
          {critical.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.10)', color: '#dc2626' }}>
              {critical.length} out
            </span>
          )}
          {low.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,119,6,0.10)', color: '#b45309' }}>
              {low.length} low
            </span>
          )}
          {items.length === 0 && (
            <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(22,163,74,0.10)', color: '#15803d' }}>
              <CheckCircle2 className="w-3 h-3" />
              All clear
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 flex-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.12)' }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#16a34a' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'rgba(15,17,23,0.55)' }}>Inventory looks healthy</p>
          <p className="text-xs" style={{ color: 'rgba(15,17,23,0.30)' }}>All products above reorder thresholds</p>
        </div>
      ) : (
        <>
          {/* Two-column grid layout */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {critical.map((item) => {
                const pct = item.reorderPoint > 0
                  ? Math.min(100, Math.round((item.quantity / (item.reorderPoint * 2)) * 100))
                  : 0

                return (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg"
                    style={{
                      borderLeft: '3px solid #dc2626',
                      background: 'rgba(220,38,38,0.03)'
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#dc2626' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold truncate mr-3" style={{ color: '#0f1117' }}>{item.name}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-sm font-bold tabular-nums" style={{ color: '#dc2626' }}>{item.quantity}</span>
                          <span className="text-xs" style={{ color: 'rgba(15,17,23,0.35)' }}>/ {item.reorderPoint}</span>
                          <span
                            className="text-xs font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(220,38,38,0.10)', color: '#dc2626' }}
                          >
                            OUT
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(15,17,23,0.08)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#dc2626,#b91c1c)' }}
                          />
                        </div>
                        <span className="text-xs font-mono shrink-0" style={{ color: 'rgba(15,17,23,0.28)' }}>{item.sku}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {low.map((item) => {
                const pct = item.reorderPoint > 0
                  ? Math.min(100, Math.round((item.quantity / (item.reorderPoint * 2)) * 100))
                  : item.quantity > 0 ? 50 : 0

                return (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg"
                    style={{
                      borderLeft: '3px solid #d97706',
                      background: 'rgba(217,119,6,0.03)'
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#d97706' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold truncate mr-3" style={{ color: '#0f1117' }}>{item.name}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-sm font-bold tabular-nums" style={{ color: '#b45309' }}>{item.quantity}</span>
                          <span className="text-xs" style={{ color: 'rgba(15,17,23,0.35)' }}>/ {item.reorderPoint}</span>
                          <span
                            className="text-xs font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(217,119,6,0.10)', color: '#b45309' }}
                          >
                            LOW
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(15,17,23,0.08)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#d97706,#b45309)' }}
                          />
                        </div>
                        <span className="text-xs font-mono shrink-0" style={{ color: 'rgba(15,17,23,0.28)' }}>{item.sku}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid rgba(15,17,23,0.07)', background: 'rgba(15,17,23,0.02)' }}
          >
            <div className="flex items-center gap-3">
              {critical.length > 0 && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: '#dc2626' }} /><span className="text-xs" style={{ color: 'rgba(15,17,23,0.45)' }}>{critical.length} out of stock</span></div>}
              {low.length > 0 && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: '#d97706' }} /><span className="text-xs" style={{ color: 'rgba(15,17,23,0.45)' }}>{low.length} low stock</span></div>}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#4F46E5' }}>
              <Box className="w-3 h-3" /><span>View Inventory</span><ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const role = useAuthStore(s => s.role)
  const user = useAuthStore(s => s.user)
  const canViewAll = role?.permissions.includes('can_view_all_branches') ?? false
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('today')
  // TODO: wire to comparison API — currently shows same data for all periods
  const branchId = canViewAll && selectedBranchId ? selectedBranchId : undefined
  const { data: stats, isLoading, isError, dataUpdatedAt, refetch, isFetching } = useDashboard(branchId)

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full" style={{ background: '#f5f6f8' }}>
        <div className="page-header">
          <div><div className="skeleton h-5 w-40 rounded mb-2" /><div className="skeleton h-3 w-52 rounded" /></div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="content-card p-5 space-y-3">
                <div className="skeleton h-9 w-9 rounded-xl" />
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-8 w-28 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="content-card" style={{ height: 300 }}><div className="skeleton h-full w-full rounded-xl" /></div>
            <div className="content-card" style={{ height: 300 }}><div className="skeleton h-full w-full rounded-xl" /></div>
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (isError || !stats) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center gap-4" style={{ background: '#f5f6f8' }}>
        <div className="flex flex-col items-center gap-4 px-8 py-8 rounded-2xl text-center" style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.12)' }}>
          <AlertTriangle className="w-10 h-10" style={{ color: '#dc2626' }} />
          <div>
            <p className="text-base font-semibold" style={{ color: '#0f1117' }}>Failed to load dashboard</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(15,17,23,0.45)' }}>Check your connection and try again</p>
          </div>
          <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2 px-4 py-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    )
  }

  const revenuePerItem = stats.todayItemsSold > 0 ? stats.todayRevenue / stats.todayItemsSold : 0

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#f5f6f8' }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        {/* Left: title + greeting */}
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Good morning, {firstName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
            {(['today', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={period === p
                  ? { background: 'var(--accent)', color: '#ffffff', boxShadow: 'var(--shadow-xs)' }
                  : { color: 'var(--text-muted)' }
                }
              >
                {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(15,17,23,0.38)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#16a34a', boxShadow: '0 0 4px rgba(22,163,74,0.5)' }} />
              Updated {lastUpdated}
            </div>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh dashboard stats"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
            style={{ color: 'rgba(15,17,23,0.40)', background: 'rgba(15,17,23,0.05)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          {canViewAll && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(15,17,23,0.45)' }}>Branch</label>
              <input
                type="text"
                placeholder={user?.branchId ?? 'All branches'}
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="dark-input w-44 font-mono text-sm"
              />
              {selectedBranchId && (
                <button onClick={() => setSelectedBranchId('')} className="btn-secondary text-xs px-2.5 py-1">Clear</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6 space-y-5 flex-1">

        {/* ── KPI Row — 4 cards like reference ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            icon={<TrendingUp className="w-4.5 h-4.5" />}
            iconBg="rgba(79,70,229,0.10)" iconColor="#4F46E5"
            label="Gross Revenue"
            value={`₱${fmtCompact(stats.todayRevenue)}`}
            delta={stats.todayRevenue > 0 ? 'Today' : undefined}
            deltaUp={true}
            accent="#4F46E5"
          />
          <KPICard
            icon={<BarChart2 className="w-4.5 h-4.5" />}
            iconBg="rgba(22,163,74,0.10)" iconColor="#16a34a"
            label="Avg. Order Value"
            value={`₱${fmtCompact(stats.averageOrderValue)}`}
            delta={stats.averageOrderValue > 0 ? `₱${fmtCompact(revenuePerItem)}/item` : undefined}
            deltaUp={true}
            accent="#16a34a"
          />
          <KPICard
            icon={<ShoppingCart className="w-4.5 h-4.5" />}
            iconBg="rgba(124,58,237,0.10)" iconColor="#7c3aed"
            label="Transactions"
            value={String(stats.todayTransactions)}
            delta={stats.todayTransactions > 0 ? `${stats.todayTransactions} sales` : undefined}
            deltaUp={true}
            accent="#7c3aed"
          />
          <KPICard
            icon={<Package className="w-4.5 h-4.5" />}
            iconBg="rgba(234,88,12,0.10)" iconColor="#ea580c"
            label="Items Sold"
            value={String(stats.todayItemsSold)}
            delta={stats.lowStockItems.length > 0
              ? `${stats.lowStockItems.length} alert${stats.lowStockItems.length !== 1 ? 's' : ''}`
              : 'Stock OK'
            }
            deltaUp={stats.lowStockItems.length === 0}
            accent="#ea580c"
          />
        </div>

        {/* ── Main Content: Revenue Trend (3/5) + Best Sellers (2/5) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <RevenueTrendPanel
              revenue={stats.todayRevenue}
              transactions={stats.todayTransactions}
              avgOrder={stats.averageOrderValue}
            />
          </div>
          <div className="lg:col-span-2">
            <BestSellersPanel items={stats.topSellers} />
          </div>
        </div>

        {/* ── Bottom Row: Stock Alerts full width ── */}
        <StockAlertsPanel items={stats.lowStockItems} />

      </div>
    </div>
  )
}
