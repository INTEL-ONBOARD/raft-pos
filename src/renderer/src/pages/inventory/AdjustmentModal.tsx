import { useState } from 'react'
import { X, ArrowUpDown } from 'lucide-react'
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
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSave() {
    setValidationError(null)
    const q = parseFloat(qty)
    if (isNaN(q) || q < 0 || (type !== 'adjustment' && q <= 0)) {
      setValidationError(type === 'adjustment' ? 'Quantity cannot be negative' : 'Quantity must be greater than 0')
      return
    }
    if (!reason.trim()) {
      setValidationError('Reason is required')
      return
    }
    await onSave(type, q, reason.trim(), notes.trim())
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <ArrowUpDown className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Adjust Stock</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.productName}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>SKU: {row.productSku} · Current stock: {row.quantity} {row.productUnit}</p>
          </div>

          <div>
            <label htmlFor="adj-type" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Adjustment Type *</label>
            <select id="adj-type" value={type} onChange={e => setType(e.target.value as AdjustmentType)}
              className="dark-select mt-1">
              <option value="in">Add Stock (In)</option>
              <option value="out">Remove Stock (Out)</option>
              <option value="adjustment">Set Exact Quantity</option>
            </select>
          </div>

          <div>
            <label htmlFor="adj-qty" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              {type === 'adjustment' ? 'New Quantity' : 'Quantity'} *
            </label>
            <input id="adj-qty" type="number" min={type === 'adjustment' ? '0' : '1'} step="any"
              value={qty} onChange={e => setQty(e.target.value)}
              className="dark-input mt-1" />
          </div>

          <div>
            <label htmlFor="adj-reason" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reason *</label>
            <input id="adj-reason" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Physical count correction"
              className="dark-input mt-1" />
          </div>

          <div>
            <label htmlFor="adj-notes" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Notes</label>
            <textarea id="adj-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="dark-input resize-none mt-1" />
          </div>

          {validationError && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
              {validationError}
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
          <button onClick={handleSave} disabled={loading || !qty || !reason}
            className="btn-primary px-5 py-2 disabled:opacity-50">
            {loading ? 'Saving...' : 'Apply Adjustment'}
          </button>
        </div>

      </div>
    </div>
  )
}
