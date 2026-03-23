// src/renderer/src/pages/transactions/RefundModal.tsx
import { useState } from 'react'
import { X, Undo2 } from 'lucide-react'
import type { ITransaction } from '@shared/types/transaction.types'

interface RefundItem {
  productId: string
  quantity: number
}

interface Props {
  transaction: ITransaction
  onConfirm: (reason: string, refundedItems: RefundItem[]) => void
  onClose: () => void
  isLoading: boolean
}

export function RefundModal({ transaction, onConfirm, onClose, isLoading }: Props) {
  const [reason, setReason] = useState('')
  // Keyed by item index to handle duplicate productIds in a single transaction
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [error, setError] = useState('')

  function handleQtyChange(idx: number, val: string) {
    const n = parseInt(val, 10)
    setQuantities(prev => ({ ...prev, [idx]: isNaN(n) ? 0 : Math.max(0, n) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Refund reason is required')
      return
    }

    const items: RefundItem[] = []
    for (let i = 0; i < transaction.items.length; i++) {
      const it = transaction.items[i]
      const qty = quantities[i] ?? 0
      if (qty > it.quantity) {
        setError(`Refund quantity for "${it.name}" exceeds sold quantity (${it.quantity})`)
        return
      }
      if (qty > 0) items.push({ productId: it.productId, quantity: qty })
    }

    if (items.length === 0) {
      setError('Select at least one item to refund')
      return
    }

    setError('')
    onConfirm(reason.trim(), items)
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <Undo2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Issue Refund</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Receipt <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{transaction.receiptNo}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Select items to refund:</p>
              {transaction.items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 text-sm rounded-xl" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{it.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{it.sku} · Sold qty: {it.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Refund qty:</label>
                    <input
                      type="number"
                      min="0"
                      max={it.quantity}
                      value={quantities[idx] ?? 0}
                      onChange={e => handleQtyChange(idx, e.target.value)}
                      className="dark-input w-16 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reason *</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                placeholder="Enter refund reason…"
                className="dark-input resize-none mt-1"
              />
              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm mt-2"
                  style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary px-5 py-2 disabled:opacity-50">
              {isLoading ? 'Processing…' : 'Issue Refund'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
