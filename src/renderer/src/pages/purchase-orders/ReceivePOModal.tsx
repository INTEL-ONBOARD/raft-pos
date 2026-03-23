// src/renderer/src/pages/purchase-orders/ReceivePOModal.tsx
import { useState } from 'react'
import { X, PackageCheck } from 'lucide-react'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import type { IPurchaseOrder } from '@shared/types/purchase-order.types'

interface Props {
  po: IPurchaseOrder
  onClose: () => void
}

interface ReceiveRow {
  productId: string
  name: string
  orderedQty: number
  receivedQty: number
  qty: string
  notes: string
}

export function ReceivePOModal({ po, onClose }: Props) {
  const { receive } = usePurchaseOrders()
  const [rows, setRows] = useState<ReceiveRow[]>(
    po.items.map(item => ({
      productId: item.productId,
      name: item.name,
      orderedQty: item.orderedQty,
      receivedQty: item.receivedQty,
      qty: '',
      notes: ''
    }))
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function updateRow(index: number, field: 'qty' | 'notes', value: string) {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  async function handleReceive() {
    setError(null)
    const items = rows
      .filter(r => r.qty !== '' && parseFloat(r.qty) > 0)
      .map(r => ({ productId: r.productId, qty: parseFloat(r.qty), notes: r.notes }))

    if (items.length === 0) {
      setError('Enter a receive quantity for at least one line item.')
      return
    }

    setSaving(true)
    try {
      await receive.mutateAsync({ poId: po._id, items })
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Failed to receive')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <PackageCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Receive Stock</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{po.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}

          <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid var(--border-subtle)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}>
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Product</th>
                  <th className="text-right px-3 py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Ordered</th>
                  <th className="text-right px-3 py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Received</th>
                  <th className="text-right px-3 py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Remaining</th>
                  <th className="text-left px-3 py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Qty to Receive</th>
                  <th className="text-left px-3 py-2 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const remaining = row.orderedQty - row.receivedQty
                  return (
                    <tr key={row.productId}
                      className={remaining <= 0 ? 'opacity-50' : ''}
                      style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{row.name}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{row.orderedQty}</td>
                      <td className="px-3 py-2 text-right" style={{ color: 'var(--text-secondary)' }}>{row.receivedQty}</td>
                      <td className="px-3 py-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{Math.max(0, remaining)}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={row.qty}
                          onChange={e => updateRow(i, 'qty', e.target.value)}
                          disabled={remaining <= 0}
                          placeholder="0"
                          className="dark-input w-24 text-right disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={row.notes}
                          onChange={e => updateRow(i, 'notes', e.target.value)}
                          disabled={remaining <= 0}
                          placeholder="Optional..."
                          className="dark-input disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
          <button
            onClick={handleReceive}
            disabled={saving}
            className="btn-primary px-5 py-2 disabled:opacity-50"
          >
            {saving ? 'Receiving...' : 'Receive Stock'}
          </button>
        </div>

      </div>
    </div>
  )
}
