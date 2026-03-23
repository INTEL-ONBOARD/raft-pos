import { useState } from 'react'
import { Search, AlertTriangle, SlidersHorizontal, Package, TrendingDown, XCircle, Warehouse } from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { AdjustmentModal } from './AdjustmentModal'
import type { StockLevelRow, AdjustmentType } from '@shared/types/inventory.types'

export default function InventoryPage() {
  const { stockQuery, adjust } = useInventory()
  const [search, setSearch] = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [adjustRow, setAdjustRow] = useState<StockLevelRow | null>(null)
  const [adjError, setAdjError] = useState<string | null>(null)

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
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <Warehouse className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Inventory</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {rows.length} products tracked
              {lowCount > 0 && (
                <span className="ml-2 font-medium" style={{ color: '#b45309' }}>· {lowCount} low stock</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1">

        {/* Summary stat chips */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ background: 'rgba(20,184,166,0.10)' }}>
              <Package className="w-4 h-4" style={{ color: '#0d9488' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Products</p>
              <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{rows.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ background: 'rgba(180,83,9,0.10)' }}>
              <TrendingDown className="w-4 h-4" style={{ color: '#b45309' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Low Stock</p>
              <p className="text-lg font-bold leading-tight" style={{ color: lowCount > 0 ? '#b45309' : 'var(--text-primary)' }}>{lowCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ background: 'rgba(220,38,38,0.10)' }}>
              <XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Out of Stock</p>
              <p className="text-lg font-bold leading-tight" style={{ color: outOfStockCount > 0 ? '#dc2626' : 'var(--text-primary)' }}>{outOfStockCount}</p>
            </div>
          </div>
        </div>

        {lowCount > 0 && (
          <div className="p-4 mb-5 flex items-center gap-3"
            style={{ background: 'rgba(180,83,9,0.07)', border: '1px solid rgba(180,83,9,0.18)', color: '#b45309', borderRadius: '0.75rem' }}>
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm">
              <strong>{lowCount}</strong> product{lowCount !== 1 ? 's are' : ' is'} at or below the low stock threshold.
            </p>
            <button onClick={() => setShowLowOnly(true)} className="ml-auto text-xs underline opacity-80 hover:opacity-100">View only</button>
          </div>
        )}

        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              inputMode="search"
              className="dark-input w-full pl-9 pr-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={showLowOnly} onChange={e => setShowLowOnly(e.target.checked)} className="rounded" />
            Low stock only
          </label>
        </div>

        <div className="content-card overflow-hidden">
          {stockQuery.isLoading ? (
            <table className="dark-table">
              <thead>
                <tr>
                  {['SKU', 'Product', 'Unit', 'In Stock', 'Low Stock Threshold', 'Reorder Point', 'Status', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}>
                        <div className="h-4 rounded animate-pulse" style={{ background: 'var(--border-subtle)', width: j === 1 ? '120px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <Warehouse className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No items found</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Try adjusting your search or filters.</p>
              </div>
            </div>
          ) : (
            <table className="dark-table">
              <thead>
                <tr>
                  {['SKU', 'Product', 'Unit', 'In Stock', 'Low Stock Threshold', 'Reorder Point', 'Status', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  // Stock bar: ratio of quantity to reorderPoint, capped at 1. If reorderPoint is 0, treat as full.
                  const barMax = row.reorderPoint > 0 ? row.reorderPoint * 2 : 100
                  const barPct = Math.min(100, Math.round((row.quantity / barMax) * 100))
                  const barColor = row.quantity <= 0
                    ? '#dc2626'
                    : row.isLowStock
                      ? '#b45309'
                      : '#16a34a'

                  return (
                    <tr key={row._id}
                      style={row.isLowStock ? { background: 'rgba(234,179,8,0.05)' } : undefined}>
                      <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{row.productSku}</td>
                      <td className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.productName}</td>
                      <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.productUnit}</td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: row.quantity <= 0 ? '#dc2626' : row.quantity <= row.lowStockThreshold ? '#b45309' : 'var(--text-primary)' }}
                          >
                            {row.quantity}
                          </span>
                          {/* Mini stock bar */}
                          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${barPct}%`,
                                background: barColor,
                                opacity: 0.75
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.lowStockThreshold}</td>
                      <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.reorderPoint}</td>
                      <td>
                        {row.quantity <= 0
                          ? <span className="badge-red">Out of Stock</span>
                          : row.isLowStock
                            ? <span className="badge-yellow">Low Stock</span>
                            : <span className="badge-green">OK</span>}
                      </td>
                      <td className="text-right row-actions">
                        <button
                          onClick={() => { setAdjustRow(row); setAdjError(null) }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                          title="Adjust stock"
                          aria-label={`Adjust stock for ${row.productName}`}
                          style={{ color: 'var(--text-secondary)', background: 'var(--border-subtle)', border: '1px solid var(--border-default)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#4F46E5'; e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.2)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.borderColor = 'var(--border-default)' }}>
                          <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
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
  )
}
