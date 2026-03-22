import { useState } from 'react'
import { Search, AlertTriangle, SlidersHorizontal } from 'lucide-react'
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

  async function handleAdjust(type: AdjustmentType, quantity: number, reason: string, notes: string) {
    if (!adjustRow) return
    setAdjError(null)
    const res = await adjust.mutateAsync({ productId: adjustRow.productId, type, quantity, reason, notes })
    if (!res.success) { setAdjError(res.error ?? 'Failed'); return }
    setAdjustRow(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">
            {rows.length} products tracked
            {lowCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {lowCount} low stock</span>}
          </p>
        </div>
      </div>

      {lowCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>{lowCount}</strong> product{lowCount !== 1 ? 's are' : ' is'} at or below the low stock threshold.
          </p>
          <button onClick={() => setShowLowOnly(true)} className="ml-auto text-xs text-amber-700 underline">View only</button>
        </div>
      )}

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showLowOnly} onChange={e => setShowLowOnly(e.target.checked)} className="rounded" />
          Low stock only
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {stockQuery.isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading stock levels...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No items found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['SKU', 'Product', 'Unit', 'In Stock', 'Low Stock Threshold', 'Reorder Point', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row._id} className={`border-b border-gray-100 hover:bg-gray-50 ${row.isLowStock ? 'bg-amber-50/30' : ''}`}>
                  <td className="py-3 px-4 text-sm font-mono text-gray-700">{row.productSku}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.productName}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{row.productUnit}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-semibold ${row.quantity <= row.lowStockThreshold ? 'text-amber-600' : 'text-gray-900'}`}>
                      {row.quantity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{row.lowStockThreshold}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{row.reorderPoint}</td>
                  <td className="py-3 px-4">
                    {row.isLowStock ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">OK</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => { setAdjustRow(row); setAdjError(null) }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
                    </button>
                  </td>
                </tr>
              ))}
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
  )
}
