// src/renderer/src/pages/pos/PaymentModal.tsx
import { useState } from 'react'
import { X, CreditCard } from 'lucide-react'
import { usePosStore } from '../../stores/pos.store'
import { useCartTotals } from '../../hooks/usePOS'
import type { PaymentMethod } from '@shared/types/transaction.types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'gcash', label: 'GCash' },
  { value: 'paymaya', label: 'PayMaya' }
]

const DEFAULT_TAX_RATE = 0

interface PaymentModalProps {
  onClose: () => void
}

export function PaymentModal({ onClose }: PaymentModalProps) {
  const addPayment = usePosStore((s) => s.addPayment)
  const totals = useCartTotals(DEFAULT_TAX_RATE)

  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [amount, setAmount] = useState<string>(
    totals.remaining > 0 ? totals.remaining.toFixed(2) : totals.totalAmount.toFixed(2)
  )
  const [reference, setReference] = useState('')

  function handleAdd() {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return
    addPayment({ method, amount: numAmount, reference })
    onClose()
  }

  const numAmount = parseFloat(amount) || 0
  const due = totals.remaining > 0 ? totals.remaining : totals.totalAmount
  const changeDue = numAmount - due

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-90 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <CreditCard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Add Payment</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment method pill tabs */}
        <div className="px-6 pt-4 pb-1">
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={
                  method === m.value
                    ? { background: 'var(--accent)', color: '#ffffff' }
                    : { background: 'var(--border-subtle)', color: 'var(--text-secondary)' }
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-3 pb-5 space-y-4">
          {/* Amount */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              step={0.01}
              inputMode="decimal"
              className="dark-input w-full mt-1"
              style={{ height: '48px', fontSize: '20px', textAlign: 'right' }}
              autoFocus
            />
          </div>

          {/* Cash change due */}
          {method === 'cash' && (
            <div className="flex justify-between items-center text-sm px-1">
              <span style={{ color: 'var(--text-muted)' }}>Change due</span>
              <span className="font-semibold" style={{ color: changeDue >= 0 ? '#16a34a' : '#dc2626' }}>
                ₱{Math.abs(changeDue).toFixed(2)}
              </span>
            </div>
          )}

          {/* Reference (for non-cash) */}
          {method !== 'cash' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Reference / Approval Code
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional"
                autoComplete="off"
                className="dark-input w-full mt-1"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
          <button
            onClick={handleAdd}
            className="btn-primary px-5 py-2"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
