// src/renderer/src/pages/pos/ReceiptModal.tsx
// Phase 4: print-preview via window.print().
// ESC/POS hardware printing is deferred to Phase 6.
import { Printer, X, FileText } from 'lucide-react'
import type { ITransaction } from '@shared/types/transaction.types'

interface ReceiptModalProps {
  transaction: ITransaction
  onClose: () => void
}

export function ReceiptModal({ transaction: txn, onClose }: ReceiptModalProps) {
  function handlePrint() {
    window.print()
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-[384px] max-h-[90vh] overflow-y-auto overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Receipt</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt body — print:bg-white print:text-black keeps thermal printing clean */}
        <div className="px-6 py-4 font-mono text-sm print:bg-white print:text-black" style={{ color: 'var(--text-primary)' }} id="receipt-content">
          <div className="text-center mb-4">
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>RAFT POS</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Receipt No: {txn.receiptNo}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(txn.createdAt).toLocaleString('en-PH')}
            </p>
          </div>

          <div className="my-2" style={{ borderTop: '1px dashed var(--border-default)' }} />

          {/* Items */}
          {txn.items.map((item) => (
            <div key={item.productId} className="mb-1">
              <div className="flex justify-between" style={{ color: 'var(--text-primary)' }}>
                <span className="flex-1 truncate">{item.name}</span>
                <span className="ml-2">&#8369;{item.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.quantity} x &#8369;{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                {item.discountAmount > 0 && (
                  <span> (-{item.discountType === 'percent' ? `${item.discountAmount}%` : `&#8369;${item.discountAmount}`})</span>
                )}
              </div>
            </div>
          ))}

          <div className="my-2" style={{ borderTop: '1px dashed var(--border-default)' }} />

          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ color: 'var(--text-primary)' }}>&#8369;{txn.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            {txn.discountAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
                <span style={{ color: 'var(--text-primary)' }}>-&#8369;{txn.discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {txn.taxAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Tax</span>
                <span style={{ color: 'var(--text-primary)' }}>&#8369;{txn.taxAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold" style={{ color: 'var(--text-primary)' }}>
              <span>TOTAL</span>
              <span>&#8369;{txn.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="my-2" style={{ borderTop: '1px dashed var(--border-default)' }} />

          {/* Payments */}
          {txn.payments.map((p, i) => (
            <div key={`${p.method}-${p.amount}-${i}`} className="flex justify-between">
              <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{p.method}</span>
              <span style={{ color: 'var(--text-primary)' }}>&#8369;{p.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
          {txn.change > 0 && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Change</span>
              <span style={{ color: 'var(--text-primary)' }}>&#8369;{txn.change.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="text-center mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Thank you for your purchase!
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="btn-secondary px-5 py-2"
          >
            New Sale
          </button>
        </div>

      </div>
    </div>
  )
}
