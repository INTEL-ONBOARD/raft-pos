// src/renderer/src/pages/transactions/RefundModal.tsx
import { useState } from 'react'
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
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [error, setError] = useState('')

  function handleQtyChange(productId: string, val: string) {
    const n = parseInt(val, 10)
    setQuantities(prev => ({ ...prev, [productId]: isNaN(n) ? 0 : Math.max(0, n) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Refund reason is required')
      return
    }
    const items: RefundItem[] = transaction.items
      .filter(it => (quantities[it.productId] ?? 0) > 0)
      .map(it => ({ productId: it.productId, quantity: quantities[it.productId] }))

    if (items.length === 0) {
      setError('Select at least one item to refund')
      return
    }

    for (const it of transaction.items) {
      const qty = quantities[it.productId] ?? 0
      if (qty > it.quantity) {
        setError(`Refund quantity for "${it.name}" exceeds sold quantity (${it.quantity})`)
        return
      }
    }

    setError('')
    onConfirm(reason.trim(), items)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Issue Refund</h2>
        <p className="text-sm text-gray-500 mb-4">
          Receipt <span className="font-medium text-gray-700">{transaction.receiptNo}</span>
        </p>

        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-gray-700">Select items to refund:</p>
          {transaction.items.map(it => (
            <div key={it.productId} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg text-sm">
              <div className="flex-1">
                <p className="font-medium text-gray-800">{it.name}</p>
                <p className="text-gray-500 text-xs">{it.sku} · Sold qty: {it.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-gray-500 text-xs">Refund qty:</label>
                <input
                  type="number"
                  min="0"
                  max={it.quantity}
                  value={quantities[it.productId] ?? 0}
                  onChange={e => handleQtyChange(it.productId, e.target.value)}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="Enter refund reason…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Processing…' : 'Issue Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
