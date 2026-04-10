import { useState, useMemo } from 'react'
import {
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  ArrowTrendingDownIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { useInventory } from '../../hooks/useInventory'
import { AdjustmentModal } from './AdjustmentModal'
import type { StockLevelRow, AdjustmentType } from '@shared/types/inventory.types'

/* ─── Colour helpers ───────────────────────────────────────────────── */
function stockColor(row: StockLevelRow) {
  if (row.quantity <= 0) return { bar: '#ef4444', text: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' }
  if (row.isLowStock)   return { bar: '#f59e0b', text: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' }
  return                       { bar: '#22c55e', text: '#4ade80', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.20)' }
}

function statusLabel(row: StockLevelRow) {
  if (row.quantity <= 0) return 'Out of Stock'
  if (row.isLowStock)   return 'Low Stock'
  return 'In Stock'
}

function healthPct(row: StockLevelRow) {
  const max = row.reorderPoint > 0 ? row.reorderPoint * 2 : Math.max(row.lowStockThreshold * 3, 100)
  return Math.min(100, Math.round((row.quantity / max) * 100))
}

/* ─── Mini ring chart ──────────────────────────────────────────────── */
function RingChart({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 600ms ease' }}
      />
    </svg>
  )
}

/* ─── Stat card (top row) ──────────────────────────────────────────── */
interface StatCardProps { label: string; value: number | string; sub?: string; icon: React.ReactNode; accent: string; accentBg: string; highlight?: boolean; hlColor?: string; onClick?: () => void }
function StatCard({ label, value, sub, icon, accent, accentBg, highlight, hlColor, onClick }: StatCardProps) {
  const [hov, setHov] = useState(false)
  const active = highlight && Number(value) > 0
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)', border: `1px solid ${active ? (hlColor ?? accent) + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: '14px', padding: '18px 20px', cursor: onClick ? 'pointer' : 'default', transition: 'all 180ms ease', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-24px', right: '-16px', width: '80px', height: '80px', borderRadius: '50%', background: accentBg, filter: 'blur(28px)', pointerEvents: 'none', opacity: active ? 1 : 0.45 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: accent }}>{icon}</div>
        </div>
        {active && <span style={{ fontSize: '10px', fontWeight: 700, color: hlColor ?? accent, background: (hlColor ?? accent) + '22', borderRadius: '99px', padding: '2px 8px' }}>ALERT</span>}
      </div>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: '0 0 4px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, margin: 0, lineHeight: 1, color: active ? (hlColor ?? accent) : '#fff' }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', margin: '5px 0 0' }}>{sub}</p>}
    </div>
  )
}

/* ─── Sort types ───────────────────────────────────────────────────── */
type SortKey = 'productName' | 'quantity' | 'lowStockThreshold' | 'reorderPoint'
type SortDir = 'asc' | 'desc'

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function InventoryPage() {
  const { stockQuery, adjust } = useInventory()
  const [search, setSearch] = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [adjustRow, setAdjustRow] = useState<StockLevelRow | null>(null)
  const [adjError, setAdjError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('productName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedRow, setSelectedRow] = useState<StockLevelRow | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const rows = stockQuery.data ?? []
  const lowCount = rows.filter(r => r.isLowStock).length
  const outCount  = rows.filter(r => r.quantity <= 0).length
  const okCount   = rows.filter(r => !r.isLowStock && r.quantity > 0).length
  const totalQty  = rows.reduce((s, r) => s + r.quantity, 0)

  const filtered = useMemo(() => {
    let list = rows.filter(r => {
      if (showLowOnly && !r.isLowStock) return false
      if (search && !r.productName.toLowerCase().includes(search.toLowerCase()) && !r.productSku.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    return [...list].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, search, showLowOnly, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  async function handleAdjust(type: AdjustmentType, quantity: number, reason: string, notes: string) {
    if (!adjustRow) return
    setAdjError(null)
    try {
      await adjust.mutateAsync({ productId: adjustRow.productId, type, quantity, reason, notes })
      setAdjustRow(null)
      // Refresh selected row data from updated stock
      if (selectedRow && selectedRow.productId === adjustRow.productId) {
        setSelectedRow(null)
      }
    } catch (err: any) {
      setAdjError(err.message ?? 'Failed')
    }
  }

  /* After a successful adjust, sync selectedRow if it was the adjusted one */
  const liveSelected = selectedRow ? (rows.find(r => r._id === selectedRow._id) ?? selectedRow) : null

  function TH({ children, col, align = 'left' }: { children: React.ReactNode; col?: SortKey; align?: 'left' | 'right' | 'center' }) {
    const active = col && sortKey === col
    return (
      <th onClick={col ? () => toggleSort(col) : undefined}
        style={{ background: 'rgba(255,255,255,0.02)', color: active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 14px', textAlign: align, borderBottom: '1px solid rgba(255,255,255,0.055)', cursor: col ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', transition: 'color 140ms' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {children}
          {col && (active
            ? (sortDir === 'asc' ? <ArrowUpIcon style={{ width: '10px' }} /> : <ArrowDownIcon style={{ width: '10px' }} />)
            : <span style={{ opacity: 0.25 }}><ArrowUpIcon style={{ width: '10px' }} /></span>
          )}
        </span>
      </th>
    )
  }

  /* ── Right panel ── */
  function RightPanel() {
    if (!liveSelected) {
      /* empty state — show global analytics */
      const healthyPct = rows.length > 0 ? Math.round((okCount / rows.length) * 100) : 0
      const lowPct     = rows.length > 0 ? Math.round((lowCount / rows.length) * 100) : 0
      const outPct     = rows.length > 0 ? Math.round((outCount / rows.length) * 100) : 0

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header */}
          <div style={{ padding: '20px 20px 0' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Overview & Analytics</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>Select a product for detailed view</p>
          </div>

          {/* Distribution donut */}
          <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>Stock Distribution</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
                  {/* out of stock */}
                  <circle cx={50} cy={50} r={38} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
                  <circle cx={50} cy={50} r={38} fill="none" stroke="#ef4444" strokeWidth={10}
                    strokeDasharray={`${(outPct/100)*239} 239`} strokeLinecap="butt" />
                  {/* low stock */}
                  <circle cx={50} cy={50} r={38} fill="none" stroke="#f59e0b" strokeWidth={10}
                    strokeDasharray={`${(lowPct/100)*239} 239`}
                    strokeDashoffset={-((outPct/100)*239)}
                    strokeLinecap="butt" />
                  {/* healthy */}
                  <circle cx={50} cy={50} r={38} fill="none" stroke="#22c55e" strokeWidth={10}
                    strokeDasharray={`${(healthyPct/100)*239} 239`}
                    strokeDashoffset={-(((outPct+lowPct)/100)*239)}
                    strokeLinecap="butt" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{rows.length}</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>TOTAL</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Healthy', pct: healthyPct, count: okCount, color: '#4ade80' },
                  { label: 'Low Stock', pct: lowPct, count: lowCount, color: '#fbbf24' },
                  { label: 'Out of Stock', pct: outPct, count: outCount, color: '#f87171' }
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{item.count} · {item.pct}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory health score */}
          <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>Health Score</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <RingChart pct={healthyPct} color={healthyPct > 70 ? '#22c55e' : healthyPct > 40 ? '#f59e0b' : '#ef4444'} size={64} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{healthyPct}%</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: healthyPct > 70 ? '#4ade80' : healthyPct > 40 ? '#fbbf24' : '#f87171', margin: 0 }}>
                  {healthyPct > 70 ? 'Good' : healthyPct > 40 ? 'Fair' : 'Critical'}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: '3px 0 0' }}>
                  {healthyPct > 70 ? 'Most products are well-stocked.' : healthyPct > 40 ? 'Several items need attention.' : 'Urgent restocking required!'}
                </p>
              </div>
            </div>
          </div>

          {/* Total units */}
          <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Warehouse Summary</p>
            {[
              { label: 'Total Units in Stock', value: totalQty.toLocaleString() },
              { label: 'Avg Units per Product', value: rows.length > 0 ? Math.round(totalQty / rows.length).toLocaleString() : '0' },
              { label: 'Products Tracked', value: rows.length.toLocaleString() }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {(lowCount > 0 || outCount > 0) && (
            <div style={{ margin: '0 16px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: '14px', padding: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Active Alerts</p>
              {rows.filter(r => r.quantity <= 0).slice(0, 3).map(r => (
                <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <XCircleIcon style={{ width: '14px', height: '14px', color: '#f87171', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.productName}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#f87171', fontWeight: 600, flexShrink: 0 }}>OUT</span>
                </div>
              ))}
              {rows.filter(r => r.isLowStock && r.quantity > 0).slice(0, 4).map(r => (
                <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ExclamationTriangleIcon style={{ width: '14px', height: '14px', color: '#fbbf24', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.productName}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#fbbf24', fontWeight: 600, flexShrink: 0 }}>{r.quantity}</span>
                </div>
              ))}
              {(lowCount + outCount) > 7 && (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', margin: '8px 0 0', textAlign: 'center' }}>
                  +{(lowCount + outCount) - 7} more alerts
                </p>
              )}
            </div>
          )}
        </div>
      )
    }

    /* Product detail panel */
    const row = liveSelected
    const c   = stockColor(row)
    const pct = healthPct(row)
    const status = statusLabel(row)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button onClick={() => setSelectedRow(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← All
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.80)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.productName}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>

          {/* Product card */}
          <div style={{ background: `linear-gradient(135deg, ${c.bg} 0%, rgba(255,255,255,0.02) 100%)`, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CubeIcon style={{ width: '20px', height: '20px', color: '#818cf8' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.productName}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.40)', margin: '2px 0 0' }}>
                  <span style={{ fontFamily: 'monospace' }}>{row.productSku}</span> · {row.productUnit}
                </p>
              </div>
            </div>

            {/* Big stock number */}
            <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
              <p style={{ fontSize: '48px', fontWeight: 800, color: c.text, margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {row.quantity.toLocaleString()}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', margin: '4px 0 0' }}>units in stock</p>
            </div>

            {/* Health bar */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>Stock Level</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: c.text }}>{pct}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: c.bar, transition: 'width 500ms ease' }} />
              </div>
            </div>

            {/* Status badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 16px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.text }} />
                {status}
              </span>
            </div>
          </div>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Low Threshold', value: row.lowStockThreshold, sub: 'min units', icon: <ArrowTrendingDownIcon style={{ width: '14px', height: '14px' }} />, color: '#fbbf24', bg: 'rgba(245,158,11,0.10)' },
              { label: 'Reorder Point', value: row.reorderPoint, sub: 'order at', icon: <ArrowPathIcon style={{ width: '14px', height: '14px' }} />, color: '#818cf8', bg: 'rgba(99,102,241,0.10)' },
              { label: 'Buffer Stock', value: Math.max(0, row.quantity - row.reorderPoint), sub: 'above reorder', icon: <ShieldCheckIcon style={{ width: '14px', height: '14px' }} />, color: '#4ade80', bg: 'rgba(34,197,94,0.10)' },
              { label: 'Until Reorder', value: row.quantity <= row.reorderPoint ? 0 : row.quantity - row.reorderPoint, sub: 'units left', icon: <InformationCircleIcon style={{ width: '14px', height: '14px' }} />, color: '#38bdf8', bg: 'rgba(56,189,248,0.10)' }
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '13px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', color: m.color }}>{m.icon}</div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: '0 0 3px' }}>{m.label}</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>{typeof m.value === 'number' ? m.value.toLocaleString() : m.value}</p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', margin: '3px 0 0' }}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Threshold vs current visual */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>Stock vs. Thresholds</p>
            {[
              { label: 'Current Stock', value: row.quantity, color: c.text, max: Math.max(row.quantity, row.reorderPoint * 2, 1) },
              { label: 'Low Threshold', value: row.lowStockThreshold, color: '#fbbf24', max: Math.max(row.quantity, row.reorderPoint * 2, 1) },
              { label: 'Reorder Point', value: row.reorderPoint, color: '#818cf8', max: Math.max(row.quantity, row.reorderPoint * 2, 1) }
            ].map(item => (
              <div key={item.label} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
                <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, Math.round((item.value / item.max) * 100))}%`, borderRadius: '99px', background: item.color, opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Quick Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => { setAdjustRow(row); setAdjError(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 150ms', width: '100%', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.20)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)' }}
              >
                <AdjustmentsHorizontalIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                Adjust Stock Quantity
              </button>
            </div>
          </div>

          {/* Product info */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '4px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Product Info</p>
            {[
              { label: 'Product ID', value: row.productId.slice(-8).toUpperCase() },
              { label: 'SKU', value: row.productSku },
              { label: 'Unit Type', value: row.productUnit },
              { label: 'Inventory ID', value: row._id.slice(-8).toUpperCase() }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.045)' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>{item.label}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.70)', fontFamily: item.label.includes('ID') || item.label === 'SKU' ? 'monospace' : 'inherit' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Skeleton rows ── */
  function SkeletonRows() {
    return (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <tr key={i}>
            {[80, 160, 100, 80, 80, 60, 70, 60].map((w, j) => (
              <td key={j} style={{ padding: '13px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="animate-pulse" style={{ height: '13px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', width: `${w}px` }} />
              </td>
            ))}
          </tr>
        ))}
      </>
    )
  }

  /* ── Root layout ── */
  return (
    <div style={{ background: 'linear-gradient(160deg,#0a0b14 0%,#080810 100%)', display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Ambient glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '400px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      {/* ══════════════════ LEFT PANEL (3/4) ══════════════════ */}
      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* Page header */}
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,rgba(99,102,241,0.22) 0%,rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CubeIcon style={{ width: '18px', height: '18px', color: '#818cf8' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Inventory</h1>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  {rows.length} products tracked
                  {lowCount > 0 && <span style={{ color: '#fbbf24', fontWeight: 600 }}> · {lowCount} need attention</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <StatCard label="Total Products" value={rows.length} sub={`${totalQty.toLocaleString()} total units`}
              icon={<CubeIcon style={{ width: '16px', height: '16px' }} />}
              accent="#818cf8" accentBg="rgba(99,102,241,0.15)" />
            <StatCard label="In Stock" value={okCount} sub={`${rows.length > 0 ? Math.round((okCount/rows.length)*100) : 0}% of products`}
              icon={<CheckCircleIcon style={{ width: '16px', height: '16px' }} />}
              accent="#4ade80" accentBg="rgba(34,197,94,0.12)" />
            <StatCard label="Low Stock" value={lowCount} sub="Below threshold"
              icon={<ArrowTrendingDownIcon style={{ width: '16px', height: '16px' }} />}
              accent="#fbbf24" accentBg="rgba(245,158,11,0.15)" highlight hlColor="#fbbf24"
              onClick={lowCount > 0 ? () => setShowLowOnly(v => !v) : undefined} />
            <StatCard label="Out of Stock" value={outCount} sub="Zero quantity"
              icon={<XCircleIcon style={{ width: '16px', height: '16px' }} />}
              accent="#f87171" accentBg="rgba(239,68,68,0.15)" highlight hlColor="#f87171" />
          </div>
        </div>

        {/* Alert banner */}
        {lowCount > 0 && (
          <div style={{ margin: '16px 28px 0', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderLeft: '3px solid #f59e0b', borderRadius: '10px', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <ExclamationTriangleIcon style={{ width: '16px', height: '16px', color: '#fbbf24', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: '#fbbf24', margin: 0, flex: 1 }}>
              <strong>{lowCount}</strong> product{lowCount !== 1 ? 's are' : ' is'} running low — review before stock runs out.
            </p>
            <button onClick={() => setShowLowOnly(v => !v)} style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {showLowOnly ? 'Show all' : 'Filter low stock'}
            </button>
          </div>
        )}

        {/* Search & filter row */}
        <div style={{ padding: '14px 28px 0', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(255,255,255,0.32)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or SKU…" inputMode="search"
              style={{ width: '100%', height: '36px', paddingLeft: '36px', paddingRight: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.50)'; e.target.style.background = 'rgba(99,102,241,0.06)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)' }} />
          </div>
          <button onClick={() => setShowLowOnly(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 150ms', background: showLowOnly ? 'rgba(245,158,11,0.13)' : 'rgba(255,255,255,0.04)', border: showLowOnly ? '1px solid rgba(245,158,11,0.28)' : '1px solid rgba(255,255,255,0.07)', color: showLowOnly ? '#fbbf24' : 'rgba(255,255,255,0.50)' }}>
            <FunnelIcon style={{ width: '13px', height: '13px' }} />
            Low only
            {showLowOnly && <span style={{ background: '#fbbf24', color: '#000', borderRadius: '99px', width: '16px', height: '16px', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{lowCount}</span>}
          </button>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
            {filtered.length} / {rows.length}
          </span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '14px 28px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.065)', borderRadius: '16px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 && !stockQuery.isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '12px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CubeIcon style={{ width: '22px', height: '22px', color: 'rgba(255,255,255,0.22)' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{search || showLowOnly ? 'No matching products' : 'No inventory yet'}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', margin: '4px 0 0' }}>{search || showLowOnly ? 'Try adjusting your filters.' : 'Products with stock tracking appear here.'}</p>
                  </div>
                  {(search || showLowOnly) && (
                    <button onClick={() => { setSearch(''); setShowLowOnly(false) }} style={{ fontSize: '12px', fontWeight: 500, color: '#818cf8', background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}>
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr>
                      <TH>SKU</TH>
                      <TH col="productName">Product</TH>
                      <TH col="quantity">In Stock</TH>
                      <TH col="lowStockThreshold">Threshold</TH>
                      <TH col="reorderPoint">Reorder</TH>
                      <TH>Unit</TH>
                      <TH align="center">Status</TH>
                      <TH align="right"></TH>
                    </tr>
                  </thead>
                  <tbody>
                    {stockQuery.isLoading ? <SkeletonRows /> : filtered.map((row, idx) => {
                      const c   = stockColor(row)
                      const pct = healthPct(row)
                      const isLast = idx === filtered.length - 1
                      const isHov = hoveredRow === row._id
                      const isSel = selectedRow?._id === row._id
                      const bd = isLast ? 'none' : '1px solid rgba(255,255,255,0.042)'

                      return (
                        <tr key={row._id}
                          onClick={() => setSelectedRow(isSel ? null : row)}
                          onMouseEnter={() => setHoveredRow(row._id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{ background: isSel ? 'rgba(99,102,241,0.07)' : isHov ? 'rgba(255,255,255,0.032)' : row.isLowStock ? 'rgba(245,158,11,0.022)' : 'transparent', cursor: 'pointer', transition: 'background 110ms', borderLeft: isSel ? '2px solid rgba(99,102,241,0.60)' : '2px solid transparent' }}>

                          {/* SKU */}
                          <td style={{ padding: '13px 14px', borderBottom: bd }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.42)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px', padding: '2px 7px' }}>{row.productSku}</span>
                          </td>

                          {/* Product */}
                          <td style={{ padding: '13px 14px', borderBottom: bd }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: isSel ? '#818cf8' : 'rgba(255,255,255,0.88)', transition: 'color 120ms' }}>{row.productName}</span>
                          </td>

                          {/* Stock level */}
                          <td style={{ padding: '13px 14px', borderBottom: bd, minWidth: '130px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <span style={{ fontSize: '15px', fontWeight: 700, color: c.text, lineHeight: 1 }}>{row.quantity.toLocaleString()}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ flex: 1, height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: c.bar, opacity: 0.85 }} />
                                </div>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>{pct}%</span>
                              </div>
                            </div>
                          </td>

                          {/* Threshold */}
                          <td style={{ padding: '13px 14px', borderBottom: bd }}>
                            <span style={{ fontSize: '13px', color: row.isLowStock ? '#fbbf24' : 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{row.lowStockThreshold}</span>
                          </td>

                          {/* Reorder */}
                          <td style={{ padding: '13px 14px', borderBottom: bd }}>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{row.reorderPoint}</span>
                          </td>

                          {/* Unit */}
                          <td style={{ padding: '13px 14px', borderBottom: bd }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.40)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', padding: '2px 7px' }}>{row.productUnit}</span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: c.bg, color: c.text }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.text, flexShrink: 0 }} />
                              {statusLabel(row)}
                            </span>
                          </td>

                          {/* Arrow / action */}
                          <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                onClick={e => { e.stopPropagation(); setAdjustRow(row); setAdjError(null) }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, padding: '5px 11px', borderRadius: '7px', color: isHov || isSel ? '#818cf8' : 'rgba(255,255,255,0.45)', background: isHov || isSel ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)', border: isHov || isSel ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap' }}
                              >
                                <AdjustmentsHorizontalIcon style={{ width: '12px', height: '12px' }} />
                                Adjust
                              </button>
                              <ChevronRightIcon style={{ width: '14px', height: '14px', color: isSel ? '#818cf8' : 'rgba(255,255,255,0.22)', transition: 'color 120ms', transform: isSel ? 'rotate(90deg)' : 'none' }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer strip */}
            {filtered.length > 0 && !stockQuery.isLoading && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)' }}>{filtered.length} products · {filtered.reduce((s, r) => s + r.quantity, 0).toLocaleString()} total units</span>
                <span style={{ color: '#4ade80', fontSize: '11px', marginLeft: 'auto' }}>{filtered.filter(r => !r.isLowStock && r.quantity > 0).length} healthy</span>
                {filtered.filter(r => r.isLowStock).length > 0 && <span style={{ color: '#fbbf24', fontSize: '11px' }}>{filtered.filter(r => r.isLowStock).length} low</span>}
                {filtered.filter(r => r.quantity <= 0).length > 0 && <span style={{ color: '#f87171', fontSize: '11px' }}>{filtered.filter(r => r.quantity <= 0).length} out</span>}
                {selectedRow && <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: '11px' }}>· 1 selected</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', flexShrink: 0, position: 'relative', zIndex: 1 }} />

      {/* ══════════════════ RIGHT PANEL (1/4) ══════════════════ */}
      <div style={{ flex: 1, minWidth: '260px', maxWidth: '320px', overflowY: 'auto', position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.15)' }}>
        <RightPanel />
      </div>

      {/* Adjustment modal */}
      {adjustRow && (
        <AdjustmentModal
          row={adjustRow}
          onSave={handleAdjust}
          onClose={() => setAdjustRow(null)}
          loading={adjust.isPending}
          error={adjError}
          clearError={() => setAdjError(null)}
        />
      )}
    </div>
  )
}
