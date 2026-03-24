import { useState } from 'react'
import {
  BuildingStorefrontIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  ArrowTrendingDownIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { useInventory } from '../../hooks/useInventory'
import { AdjustmentModal } from './AdjustmentModal'
import type { StockLevelRow, AdjustmentType } from '@shared/types/inventory.types'

export default function InventoryPage() {
  const { stockQuery, adjust } = useInventory()
  const [search, setSearch] = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [adjustRow, setAdjustRow] = useState<StockLevelRow | null>(null)
  const [adjError, setAdjError] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const rows = stockQuery.data ?? []
  const filtered = rows.filter(r => {
    if (showLowOnly && !r.isLowStock) return false
    if (search && !r.productName.toLowerCase().includes(search.toLowerCase()) &&
      !r.productSku.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const lowCount = rows.filter(r => r.isLowStock).length
  const outOfStockCount = rows.filter(r => r.quantity <= 0).length

  async function handleAdjust(type: AdjustmentType, quantity: number, reason: string, notes: string) {
    if (!adjustRow) return
    setAdjError(null)
    try {
      await adjust.mutateAsync({ productId: adjustRow.productId, type, quantity, reason, notes })
      setAdjustRow(null)
    } catch (err: any) {
      setAdjError(err.message ?? 'Failed')
    }
  }

  return (
    <div style={{ background: '#080810', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)' }} />

      {/* All content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Page header */}
        <div style={{ padding: '28px 36px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', background: 'rgba(99,102,241,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BuildingStorefrontIcon style={{ width: '18px', height: '18px', color: '#6366f1' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Inventory</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.40)', marginTop: '2px', margin: 0 }}>
                {rows.length} products tracked
                {lowCount > 0 && (
                  <span style={{ marginLeft: '8px', fontWeight: 500, color: '#fbbf24' }}>· {lowCount} low stock</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: '0 36px 36px', flex: 1 }}>

          {/* Summary stat chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(20,184,166,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CubeIcon style={{ width: '16px', height: '16px', color: '#0d9488' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', margin: 0 }}>Total Products</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, margin: 0 }}>{rows.length}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(251,191,36,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowTrendingDownIcon style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', margin: 0 }}>Low Stock</p>
                <p style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.2, margin: 0, color: lowCount > 0 ? '#fbbf24' : '#ffffff' }}>{lowCount}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(220,38,38,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <XCircleIcon style={{ width: '16px', height: '16px', color: '#dc2626' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', margin: 0 }}>Out of Stock</p>
                <p style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.2, margin: 0, color: outOfStockCount > 0 ? '#dc2626' : '#ffffff' }}>{outOfStockCount}</p>
              </div>
            </div>
          </div>

          {/* Low stock alert banner */}
          {lowCount > 0 && (
            <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', color: '#fbbf24' }}>
              <ExclamationTriangleIcon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              <p style={{ fontSize: '14px', margin: 0 }}>
                <strong>{lowCount}</strong> product{lowCount !== 1 ? 's are' : ' is'} at or below the low stock threshold.
              </p>
              <button onClick={() => setShowLowOnly(true)} style={{ marginLeft: 'auto', fontSize: '12px', textDecoration: 'underline', opacity: 0.8, background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}>
                View only
              </button>
            </div>
          )}

          {/* Search / filter row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1', maxWidth: '320px' }}>
              <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.40)', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or SKU..."
                inputMode="search"
                className="dark-input"
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '14px' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', userSelect: 'none', color: 'rgba(255,255,255,0.65)' }}>
              <input type="checkbox" checked={showLowOnly} onChange={e => setShowLowOnly(e.target.checked)} style={{ borderRadius: '4px' }} />
              Low stock only
            </label>
          </div>

          {/* Table container */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
            {stockQuery.isLoading ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['SKU', 'Product', 'Unit', 'In Stock', 'Low Stock Threshold', 'Reorder Point', 'Status', ''].map(h => (
                      <th key={h} style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.28)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="animate-pulse" style={{ height: '16px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', width: j === 1 ? '120px' : '70px' }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BuildingStorefrontIcon style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.28)' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', margin: 0 }}>No items found</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.40)', marginTop: '4px', margin: 0 }}>Try adjusting your search or filters.</p>
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['SKU', 'Product', 'Unit', 'In Stock', 'Low Stock Threshold', 'Reorder Point', 'Status', ''].map(h => (
                      <th key={h} style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.28)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, idx) => {
                    const barMax = row.reorderPoint > 0 ? row.reorderPoint * 2 : 100
                    const barPct = Math.min(100, Math.round((row.quantity / barMax) * 100))
                    const barColor = row.quantity <= 0 ? '#dc2626' : row.isLowStock ? '#fbbf24' : '#16a34a'
                    const isLast = idx === filtered.length - 1

                    return (
                      <tr key={row._id}
                        onMouseEnter={() => setHoveredRow(row._id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ background: hoveredRow === row._id ? 'rgba(255,255,255,0.03)' : row.isLowStock ? 'rgba(251,191,36,0.03)' : 'transparent' }}>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace' }}>{row.productSku}</td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{row.productName}</td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{row.productUnit}</td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontWeight: 600, color: row.quantity <= 0 ? '#dc2626' : row.quantity <= row.lowStockThreshold ? '#fbbf24' : 'rgba(255,255,255,0.88)' }}>
                              {row.quantity}
                            </span>
                            <div style={{ width: '64px', height: '4px', borderRadius: '9999px', overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
                              <div style={{ height: '100%', borderRadius: '9999px', width: `${barPct}%`, background: barColor, opacity: 0.75 }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{row.lowStockThreshold}</td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{row.reorderPoint}</td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                          {row.quantity <= 0
                            ? <span className="badge-red">Out of Stock</span>
                            : row.isLowStock
                              ? <span className="badge-yellow">Low Stock</span>
                              : <span className="badge-green">OK</span>}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', textAlign: 'right' }}>
                          <button
                            onClick={() => { setAdjustRow(row); setAdjError(null) }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                            title="Adjust stock"
                            aria-label={`Adjust stock for ${row.productName}`}
                            style={{ color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}>
                            <AdjustmentsHorizontalIcon style={{ width: '14px', height: '14px' }} /> Adjust
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {adjustRow && (
            <AdjustmentModal
              row={adjustRow}
              onSave={handleAdjust}
              onClose={() => setAdjustRow(null)}
              loading={adjust.isPending}
              error={adjError}
            />
          )}
        </div>
      </div>
    </div>
  )
}
