// src/renderer/src/pages/transactions/VoidModal.tsx
import { useState } from 'react'
import { X, Ban } from 'lucide-react'
import type { ITransaction } from '@shared/types/transaction.types'

interface Props {
  transaction: ITransaction
  onConfirm: (reason: string) => void
  onClose: () => void
  isLoading: boolean
}

export function VoidModal({ transaction, onConfirm, onClose, isLoading }: Props) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Void reason is required')
      return
    }
    setError('')
    onConfirm(reason.trim())
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
              <Ban className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Void Transaction</h2>
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
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Receipt <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{transaction.receiptNo}</span> — ₱{transaction.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>

            <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(180,83,9,0.08)', color: '#b45309', border: '1px solid rgba(180,83,9,0.18)' }}>
              This will cancel the transaction and restore all inventory. This action cannot be undone.
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Reason *</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Enter void reason…"
                className="dark-input resize-none mt-1"
                autoFocus
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
            <button type="submit" disabled={isLoading} className="btn-danger px-5 py-2 disabled:opacity-50">
              {isLoading ? 'Voiding…' : 'Void Transaction'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
