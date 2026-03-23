// src/renderer/src/pages/transactions/VoidModal.tsx
import { useState } from 'react'
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Void Transaction</h2>
        <p className="text-sm text-gray-500 mb-4">
          Receipt <span className="font-medium text-gray-700">{transaction.receiptNo}</span> — ₱{transaction.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-4">
          This will cancel the transaction and restore all inventory. This action cannot be undone.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Enter void reason…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {isLoading ? 'Voiding…' : 'Void Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
