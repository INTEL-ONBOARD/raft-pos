// src/renderer/src/pages/transactions/TransactionDetailModal.tsx
import type { ITransaction } from '@shared/types/transaction.types'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusColor(s: string) {
  if (s === 'completed') return 'bg-green-100 text-green-700'
  if (s === 'voided') return 'bg-red-100 text-red-700'
  if (s === 'refunded') return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t.receiptNo}</h2>
            <p className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(t.status)}`}>
              {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
            </span>
            <button onClick={handlePrint} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Print</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Items</p>
            <div className="space-y-1">
              {t.items.map(it => (
                <div key={it.productId} className="flex justify-between text-sm">
                  <span className="text-gray-700">{it.name} <span className="text-gray-400">× {it.quantity}</span></span>
                  <span className="text-gray-900 font-medium">₱{fmt(it.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₱{fmt(t.subtotal)}</span></div>
            {t.discountAmount > 0 && (
              <div className="flex justify-between text-gray-600"><span>Discount</span><span>-₱{fmt(t.discountAmount)}</span></div>
            )}
            {t.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600"><span>Tax ({t.taxRate}%)</span><span>₱{fmt(t.taxAmount)}</span></div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 text-base pt-1 border-t border-gray-100">
              <span>Total</span><span>₱{fmt(t.totalAmount)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Payments</p>
            <div className="space-y-1">
              {t.payments.map((p, i) => (
                <div key={`${p.method}-${p.amount}-${i}`} className="flex justify-between text-sm">
                  <span className="text-gray-600 uppercase">{p.method}{p.reference ? ` · ${p.reference}` : ''}</span>
                  <span>₱{fmt(p.amount)}</span>
                </div>
              ))}
              {t.change > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Change</span><span>₱{fmt(t.change)}</span>
                </div>
              )}
            </div>
          </div>

          {t.status === 'voided' && t.voidReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
              <span className="font-medium">Voided:</span> {t.voidReason}
              {t.voidedAt && <span className="block text-xs mt-0.5">{new Date(t.voidedAt).toLocaleString()}</span>}
            </div>
          )}
          {t.status === 'refunded' && t.refundReason && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-700">
              <span className="font-medium">Refunded:</span> {t.refundReason}
              {t.refundedAt && <span className="block text-xs mt-0.5">{new Date(t.refundedAt).toLocaleString()}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
