import { useState } from 'react'
import { X } from 'lucide-react'
import type { StockLevelRow, AdjustmentType } from '@shared/types/inventory.types'

interface Props {
  row: StockLevelRow
  onSave: (type: AdjustmentType, quantity: number, reason: string, notes: string) => Promise<void>
  onClose: () => void
  loading: boolean
  error: string | null
}

export function AdjustmentModal({ row, onSave, onClose, loading, error }: Props) {
  const [type, setType] = useState<AdjustmentType>('in')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSave() {
    const q = parseFloat(qty)
    // For 'in'/'out', q must be > 0. For 'adjustment' (set exact), q >= 0 is valid (zero-out stock)
    if (isNaN(q) || q < 0 || (type !== 'adjustment' && q <= 0)) return
    if (!reason.trim()) return
    await onSave(type, q, reason.trim(), notes.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Adjust Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{row.productName}</p>
            <p className="text-xs text-gray-500 mt-0.5">SKU: {row.productSku} · Current stock: {row.quantity} {row.productUnit}</p>
          </div>

          <div>
            <label htmlFor="adj-type" className="block text-xs font-medium text-gray-600 mb-1">Adjustment Type *</label>
            <select id="adj-type" value={type} onChange={e => setType(e.target.value as AdjustmentType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="in">Add Stock (In)</option>
              <option value="out">Remove Stock (Out)</option>
              <option value="adjustment">Set Exact Quantity</option>
            </select>
          </div>

          <div>
            <label htmlFor="adj-qty" className="block text-xs font-medium text-gray-600 mb-1">
              {type === 'adjustment' ? 'New Quantity' : 'Quantity'} *
            </label>
            <input id="adj-qty" type="number" min={type === 'adjustment' ? '0' : '1'} step="any"
              value={qty} onChange={e => setQty(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="adj-reason" className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
            <input id="adj-reason" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Physical count correction"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="adj-notes" className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea id="adj-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-200">
          <button onClick={handleSave} disabled={loading || !qty || !reason}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {loading ? 'Saving...' : 'Apply Adjustment'}
          </button>
          <button onClick={onClose} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      </div>
    </div>
  )
}
