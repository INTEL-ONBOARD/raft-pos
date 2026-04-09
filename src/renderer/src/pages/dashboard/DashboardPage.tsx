// src/renderer/src/pages/dashboard/DashboardPage.tsx
import { useState } from 'react'
import {
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  ChartBarSquareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  CubeIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
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

// ─── KPI Card ────────────────────────────────────────────────────────────────
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

function KPICard({ icon, iconBg, label, value, delta, deltaUp, accent }: KPICardProps) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '16px 20px',
        borderTop: `2px solid ${accent}`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* subtle top glow */}
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          top: 0,
          height: '40px',
          pointerEvents: 'none',
          background: `linear-gradient(180deg, ${accent}1a 0%, transparent 100%)`
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: iconBg
          }}
        >
          {icon}
        </div>
        {delta && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              background: deltaUp ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.10)',
              color: deltaUp ? '#15803d' : '#dc2626'
            }}
          >
            {deltaUp ? (
              <ArrowUpRightIcon style={{ width: '12px', height: '12px' }} />
            ) : (
              <ArrowDownRightIcon style={{ width: '12px', height: '12px' }} />
            )}
            {delta}
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <p
          style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.35)',
            margin: 0
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#ffffff',
            marginTop: '2px',
            marginBottom: 0,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums'
          }}
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

// ─── Revenue Sparkline ────────────────────────────────────────────────────────
function RevenueTrendPanel({
  revenue,
  transactions,
  avgOrder
}: {
  revenue: number
  transactions: number
  avgOrder: number
}) {
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm']
  const weights = [0.06, 0.11, 0.16, 0.22, 0.19, 0.15, 0.11]
  const points = weights.map((w) => Math.round(w * revenue))

  const W = 480
  const H = 140
  const pad = { t: 12, b: 24, l: 8, r: 8 }
  const maxVal = Math.max(...points, 1)
  const xs = points.map((_, i) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r))
  const ys = points.map((v) => pad.t + (1 - v / maxVal) * (H - pad.t - pad.b))

  const pts: [number, number][] = xs.map((x, i) => [x, ys[i]])
  const linePath = catmullRom(pts)
  const areaPath = linePath + ` L${xs[xs.length - 1]},${H - pad.b} L${xs[0]},${H - pad.b} Z`

  const isPositive = revenue > 0

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.35)',
              margin: 0
            }}
          >
            Revenue Trend
          </p>
          <p
            style={{
              fontSize: '12px',
              marginTop: '2px',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: 0
            }}
          >
            Today — estimated hourly distribution
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            ₱{fmtCompact(revenue)}
          </p>
          <p
            style={{
              fontSize: '12px',
              marginTop: '2px',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: 0
            }}
          >
            total today
          </p>
        </div>
      </div>

      {/* SVG Chart — kept as-is per spec */}
      <div style={{ padding: '16px 16px 8px' }}>
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
            stroke={isPositive ? '#4F46E5' : 'rgba(255,255,255,0.10)'}
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
              fill="rgba(255,255,255,0.28)"
              fontFamily="Inter, sans-serif"
            >
              {h}
            </text>
          ))}
        </svg>
      </div>

      {/* Bottom stat row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          marginTop: 'auto'
        }}
      >
        {[
          { label: 'Transactions', value: String(transactions) },
          { label: 'Avg Order', value: `₱${fmtCompact(avgOrder)}` },
          {
            label: 'Revenue/Txn',
            value: transactions > 0 ? `₱${fmtCompact(revenue / transactions)}` : '—'
          }
        ].map(({ label, value }, idx) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px 0',
              gap: '2px',
              borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none'
            }}
          >
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#ffffff',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {value}
            </span>
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

// ─── Best Sellers Panel ───────────────────────────────────────────────────────
function BestSellersPanel({ items }: { items: TopSellerItem[] }) {
  const maxRevenue = Math.max(...items.map((s) => s.revenue), 1)
  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(217,119,6,0.10)'
            }}
          >
            <ArrowTrendingUpIcon style={{ width: '14px', height: '14px', color: '#b45309' }} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
            Best selling products
          </span>
        </div>
        {items.length > 0 && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(217,119,6,0.10)',
              color: '#b45309'
            }}
          >
            {items.length} tracked
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '48px 0',
            flex: 1
          }}
        >
          <ArrowTrendingUpIcon
            style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.20)' }}
          />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.40)', margin: 0 }}>
            No sales yet today
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)', margin: 0 }}>
            Process a transaction to see top products here
          </p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 90px 64px',
              padding: '8px 20px',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.28)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <span>#</span>
            <span>Product</span>
            <span style={{ textAlign: 'right' }}>Revenue</span>
            <span style={{ textAlign: 'right' }}>Sales</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.map((item, i) => {
              return (
                <div
                  key={item.productId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr 90px 64px',
                    alignItems: 'start',
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  {/* Rank badge */}
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                      background: rankStyle(i + 1).bg,
                      color: rankStyle(i + 1).color
                    }}
                  >
                    {i + 1}
                  </span>

                  {/* Name + progress bar */}
                  <div style={{ minWidth: 0, paddingRight: '16px' }}>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#ffffff',
                        margin: 0
                      }}
                    >
                      {item.name}
                    </p>
                    <div
                      style={{
                        marginTop: '6px',
                        height: '4px',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.06)'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '999px',
                          width: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0}%`,
                          background: '#6366f1',
                          opacity: 0.6
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        marginTop: '2px',
                        display: 'block',
                        color: 'rgba(255,255,255,0.35)'
                      }}
                    >
                      {item.sku}
                    </span>
                  </div>

                  {/* Revenue */}
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      textAlign: 'right',
                      color: '#ffffff',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    ₱{fmtCompact(item.revenue)}
                  </span>

                  {/* Units */}
                  <span
                    style={{
                      fontSize: '14px',
                      textAlign: 'right',
                      color: 'rgba(255,255,255,0.55)',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {item.unitsSold}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              Top {items.length} products today
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#ffffff',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              ₱{fmt(totalRevenue)}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Stock Alerts Panel ───────────────────────────────────────────────────────
function StockAlertsPanel({ items }: { items: LowStockItem[] }) {
  const critical = items.filter((i) => i.quantity <= 0)
  const low = items.filter((i) => i.quantity > 0)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: critical.length > 0 ? 'rgba(220,38,38,0.10)' : 'rgba(217,119,6,0.10)'
            }}
          >
            <ExclamationTriangleIcon
              style={{
                width: '14px',
                height: '14px',
                color: critical.length > 0 ? '#dc2626' : '#b45309'
              }}
            />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Stock Alerts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {critical.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(220,38,38,0.10)',
                color: '#dc2626'
              }}
            >
              {critical.length} out
            </span>
          )}
          {low.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(217,119,6,0.10)',
                color: '#b45309'
              }}
            >
              {low.length} low
            </span>
          )}
          {items.length === 0 && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(22,163,74,0.10)',
                color: '#15803d'
              }}
            >
              <CheckCircleIcon style={{ width: '12px', height: '12px' }} />
              All clear
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '40px 0',
            flex: 1
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(22,163,74,0.07)',
              border: '1px solid rgba(22,163,74,0.12)'
            }}
          >
            <CheckCircleIcon style={{ width: '20px', height: '20px', color: '#16a34a' }} />
          </div>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.60)',
              margin: 0
            }}
          >
            Inventory looks healthy
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            All products above reorder thresholds
          </p>
        </div>
      ) : (
        <>
          {/* Two-column grid layout */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {critical.map((item) => {
                const pct =
                  item.reorderPoint > 0
                    ? Math.min(100, Math.round((item.quantity / (item.reorderPoint * 2)) * 100))
                    : 0

                return (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      borderLeft: '3px solid #dc2626',
                      background: 'rgba(220,38,38,0.03)'
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: '#dc2626'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px'
                        }}
                      >
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginRight: '12px',
                            color: '#ffffff',
                            margin: 0
                          }}
                        >
                          {item.name}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                          }}
                        >
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#dc2626',
                              fontVariantNumeric: 'tabular-nums'
                            }}
                          >
                            {item.quantity}
                          </span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                            / {item.reorderPoint}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(220,38,38,0.10)',
                              color: '#dc2626'
                            }}
                          >
                            OUT
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '999px',
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.06)'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '999px',
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg,#dc2626,#b91c1c)'
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            flexShrink: 0,
                            color: 'rgba(255,255,255,0.35)'
                          }}
                        >
                          {item.sku}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {low.map((item) => {
                const pct =
                  item.reorderPoint > 0
                    ? Math.min(100, Math.round((item.quantity / (item.reorderPoint * 2)) * 100))
                    : item.quantity > 0
                      ? 50
                      : 0

                return (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      borderLeft: '3px solid #d97706',
                      background: 'rgba(217,119,6,0.03)'
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: '#d97706'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px'
                        }}
                      >
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginRight: '12px',
                            color: '#ffffff',
                            margin: 0
                          }}
                        >
                          {item.name}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                          }}
                        >
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#b45309',
                              fontVariantNumeric: 'tabular-nums'
                            }}
                          >
                            {item.quantity}
                          </span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                            / {item.reorderPoint}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(217,119,6,0.10)',
                              color: '#b45309'
                            }}
                          >
                            LOW
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '999px',
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.06)'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '999px',
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg,#d97706,#b45309)'
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            flexShrink: 0,
                            color: 'rgba(255,255,255,0.35)'
                          }}
                        >
                          {item.sku}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {critical.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#dc2626'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                    {critical.length} out of stock
                  </span>
                </div>
              )}
              {low.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#d97706'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                    {low.length} low stock
                  </span>
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#818cf8'
              }}
            >
              <CubeIcon style={{ width: '12px', height: '12px' }} />
              <span>View Inventory</span>
              <ArrowRightIcon style={{ width: '12px', height: '12px' }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const role = useAuthStore((s) => s.role)
  const user = useAuthStore((s) => s.user)
  const canViewAll = role?.permissions.includes('can_view_all_branches') ?? false
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('today')
  // TODO: wire to comparison API — currently shows same data for all periods
  const branchId = canViewAll && selectedBranchId ? selectedBranchId : undefined
  const {
    data: stats,
    isLoading,
    isError,
    dataUpdatedAt,
    refetch,
    isFetching
  } = useDashboard(branchId)

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : null

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div
        style={{
          background: '#080810',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background:
              'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)'
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}
        >
          <div
            style={{
              padding: '28px 36px 20px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                className="skeleton"
                style={{ height: '20px', width: '160px', borderRadius: '6px', marginBottom: '8px' }}
              />
              <div
                className="skeleton"
                style={{ height: '12px', width: '208px', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div
            style={{
              padding: '0 36px 36px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}
              className="xl:grid-cols-4"
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: '36px', width: '36px', borderRadius: '10px' }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: '12px', width: '80px', borderRadius: '4px' }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: '32px', width: '112px', borderRadius: '4px' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  height: '300px'
                }}
              >
                <div
                  className="skeleton"
                  style={{ height: '100%', width: '100%', borderRadius: '16px' }}
                />
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  height: '300px'
                }}
              >
                <div
                  className="skeleton"
                  style={{ height: '100%', width: '100%', borderRadius: '16px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (isError || !stats) {
    return (
      <div
        style={{
          background: '#080810',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background:
              'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)'
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '32px',
              borderRadius: '16px',
              textAlign: 'center',
              background: 'rgba(220,38,38,0.05)',
              border: '1px solid rgba(220,38,38,0.12)'
            }}
          >
            <ExclamationTriangleIcon style={{ width: '40px', height: '40px', color: '#dc2626' }} />
            <div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                Failed to load dashboard
              </p>
              <p
                style={{
                  fontSize: '14px',
                  marginTop: '4px',
                  color: 'rgba(255,255,255,0.55)',
                  marginBottom: 0
                }}
              >
                Check your connection and try again
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <ArrowPathIcon style={{ width: '16px', height: '16px' }} /> Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const revenuePerItem = stats.todayItemsSold > 0 ? stats.todayRevenue / stats.todayItemsSold : 0

  return (
    <div
      style={{
        background: '#080810',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%'
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)'
        }}
      />

      {/* Content wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
      >
        {/* Page header */}
        <div
          style={{
            padding: '28px 36px 20px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Left: icon pill + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                background: 'rgba(99,102,241,0.12)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Squares2X2Icon style={{ width: '18px', height: '18px', color: '#a5b4fc' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Dashboard
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.40)',
                  marginTop: '2px',
                  marginBottom: 0
                }}
              >
                Good morning, {firstName}
              </p>
            </div>
          </div>

          {/* Right: controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Period toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)'
              }}
            >
              {(['today', '7d', '30d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={
                    period === p
                      ? {
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: '#6366f1',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer'
                        }
                      : {
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.40)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }
                  }
                >
                  {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>

            {lastUpdated && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.40)'
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#16a34a',
                    boxShadow: '0 0 4px rgba(22,163,74,0.5)'
                  }}
                />
                Updated {lastUpdated}
              </div>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh dashboard stats"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.40)',
                background: 'rgba(255,255,255,0.04)',
                border: 'none',
                cursor: 'pointer',
                opacity: isFetching ? 0.4 : 1
              }}
            >
              <ArrowPathIcon
                className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
                style={{ width: '14px', height: '14px' }}
              />
            </button>
            {canViewAll && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'rgba(255,255,255,0.50)'
                  }}
                >
                  Branch
                </label>
                <input
                  type="text"
                  placeholder={user?.branchId ?? 'All branches'}
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="dark-input"
                  style={{ width: '176px', fontFamily: 'monospace', fontSize: '13px' }}
                />
                {selectedBranchId && (
                  <button
                    onClick={() => setSelectedBranchId('')}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '0 36px 36px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* KPI Row */}
          <div className="grid grid-cols-2 xl:grid-cols-4" style={{ display: 'grid', gap: '16px' }}>
            <KPICard
              icon={
                <ArrowTrendingUpIcon style={{ width: '18px', height: '18px', color: '#6366f1' }} />
              }
              iconBg="rgba(99,102,241,0.12)"
              iconColor="#6366f1"
              label="Gross Revenue"
              value={`₱${fmtCompact(stats.todayRevenue)}`}
              delta={stats.todayRevenue > 0 ? 'Today' : undefined}
              deltaUp={true}
              accent="#6366f1"
            />
            <KPICard
              icon={
                <ChartBarSquareIcon style={{ width: '18px', height: '18px', color: '#16a34a' }} />
              }
              iconBg="rgba(22,163,74,0.10)"
              iconColor="#16a34a"
              label="Avg. Order Value"
              value={`₱${fmtCompact(stats.averageOrderValue)}`}
              delta={
                stats.averageOrderValue > 0 ? `₱${fmtCompact(revenuePerItem)}/item` : undefined
              }
              deltaUp={true}
              accent="#16a34a"
            />
            <KPICard
              icon={
                <ShoppingCartIcon style={{ width: '18px', height: '18px', color: '#7c3aed' }} />
              }
              iconBg="rgba(124,58,237,0.10)"
              iconColor="#7c3aed"
              label="Transactions"
              value={String(stats.todayTransactions)}
              delta={stats.todayTransactions > 0 ? `${stats.todayTransactions} sales` : undefined}
              deltaUp={true}
              accent="#7c3aed"
            />
            <KPICard
              icon={<ArchiveBoxIcon style={{ width: '18px', height: '18px', color: '#ea580c' }} />}
              iconBg="rgba(234,88,12,0.10)"
              iconColor="#ea580c"
              label="Items Sold"
              value={String(stats.todayItemsSold)}
              delta={
                stats.lowStockItems.length > 0
                  ? `${stats.lowStockItems.length} alert${stats.lowStockItems.length !== 1 ? 's' : ''}`
                  : 'Stock OK'
              }
              deltaUp={stats.lowStockItems.length === 0}
              accent="#ea580c"
            />
          </div>

          {/* Revenue Trend (3/5) + Best Sellers (2/5) */}
          <div className="grid grid-cols-1 lg:grid-cols-5" style={{ display: 'grid', gap: '20px' }}>
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

          {/* Stock Alerts */}
          <StockAlertsPanel items={stats.lowStockItems} />
        </div>
      </div>
    </div>
  )
}
