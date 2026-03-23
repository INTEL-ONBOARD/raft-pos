// src/renderer/src/pages/transactions/TransactionDetailModal.tsx
import { X, Receipt } from 'lucide-react'
import type { ITransaction } from '@shared/types/transaction.types'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusBadge(s: string) {
  if (s === 'completed') return { background: 'rgba(22,163,74,0.10)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.20)' }
  if (s === 'voided') return { background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.18)' }
  if (s === 'refunded') return { background: 'rgba(180,83,9,0.08)', color: '#b45309', border: '1px solid rgba(180,83,9,0.18)' }
  return { background: 'var(--border-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }
}

interface Props {
  transaction: ITransaction
  onClose: () => void
}

export function TransactionDetailModal({ transaction: t, onClose }: Props) {
  function handlePrint() {
    const win = window.open('', '_blank', 'width=400,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt ${escapeHtml(t.receiptNo)}</title>
<style>
  body { font-family: monospace; width: 300px; margin: 0 auto; padding: 12px; font-size: 12px; }
  h2 { text-align: center; margin: 0 0 8px; font-size: 14px; }
  .center { text-align: center; }
  .row { display: flex; justify-content: space-between; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .bold { font-weight: bold; }
</style></head><body>
<h2>RECEIPT</h2>
<p class="center">${escapeHtml(t.receiptNo)}</p>
<p class="center">${new Date(t.createdAt).toLocaleString()}</p>
<div class="divider"></div>
${t.items.map(it => `
<div class="row"><span>${escapeHtml(it.name)}</span></div>
<div class="row"><span>${it.quantity} × ₱${fmt(it.unitPrice)}</span><span>₱${fmt(it.totalPrice)}</span></div>
`).join('')}
<div class="divider"></div>
<div class="row"><span>Subtotal</span><span>₱${fmt(t.subtotal)}</span></div>
${t.discountAmount > 0 ? `<div class="row"><span>Discount</span><span>-₱${fmt(t.discountAmount)}</span></div>` : ''}
${t.taxAmount > 0 ? `<div class="row"><span>Tax</span><span>₱${fmt(t.taxAmount)}</span></div>` : ''}
<div class="row bold"><span>TOTAL</span><span>₱${fmt(t.totalAmount)}</span></div>
<div class="divider"></div>
${t.payments.map(p => `<div class="row"><span>${escapeHtml(p.method.toUpperCase())}</span><span>₱${fmt(p.amount)}</span></div>`).join('')}
${t.change > 0 ? `<div class="row"><span>Change</span><span>₱${fmt(t.change)}</span></div>` : ''}
<div class="divider"></div>
<p class="center">Thank you!</p>
</body></html>`)
    win.document.close()
    win.print()
  }

  const badge = statusBadge(t.status)

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-xl max-h-[90vh] overflow-y-auto overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <Receipt className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.receiptNo}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={badge}>
              {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
            </span>
            <button onClick={handlePrint} className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Print</button>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Items */}
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Items</p>
            <div className="space-y-1">
              {t.items.map(it => (
                <div key={it.productId} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-primary)' }}>{it.name} <span style={{ color: 'var(--text-muted)' }}>× {it.quantity}</span></span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>₱{fmt(it.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="pt-3 space-y-1 text-sm" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}><span>Subtotal</span><span>₱{fmt(t.subtotal)}</span></div>
            {t.discountAmount > 0 && (
              <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}><span>Discount</span><span>-₱{fmt(t.discountAmount)}</span></div>
            )}
            {t.taxAmount > 0 && (
              <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}><span>Tax ({t.taxRate}%)</span><span>₱{fmt(t.taxAmount)}</span></div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1" style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border-subtle)' }}>
              <span>Total</span><span>₱{fmt(t.totalAmount)}</span>
            </div>
          </div>

          {/* Payments */}
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Payments</p>
            <div className="space-y-1">
              {t.payments.map((p, i) => (
                <div key={`${p.method}-${p.amount}-${i}`} className="flex justify-between text-sm">
                  <span className="uppercase" style={{ color: 'var(--text-secondary)' }}>{p.method}{p.reference ? ` · ${p.reference}` : ''}</span>
                  <span style={{ color: 'var(--text-primary)' }}>₱{fmt(p.amount)}</span>
                </div>
              ))}
              {t.change > 0 && (
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>Change</span><span>₱{fmt(t.change)}</span>
                </div>
              )}
            </div>
          </div>

          {t.status === 'voided' && t.voidReason && (
            <div className="px-4 py-3 text-sm rounded-lg" style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.15)' }}>
              <span className="font-medium">Voided:</span> {t.voidReason}
              {t.voidedAt && <span className="block text-xs mt-0.5" style={{ color: 'rgba(220,38,38,0.65)' }}>{new Date(t.voidedAt).toLocaleString()}</span>}
            </div>
          )}
          {t.status === 'refunded' && t.refundReason && (
            <div className="px-4 py-3 text-sm rounded-lg" style={{ background: 'rgba(180,83,9,0.06)', color: '#b45309', border: '1px solid rgba(180,83,9,0.18)' }}>
              <span className="font-medium">Refunded:</span> {t.refundReason}
              {t.refundedAt && <span className="block text-xs mt-0.5" style={{ color: 'rgba(180,83,9,0.65)' }}>{new Date(t.refundedAt).toLocaleString()}</span>}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
