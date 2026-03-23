// src/renderer/src/pages/transactions/TransactionsPage.tsx
import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTransactions, usePOS } from '../../hooks/usePOS'
import { useAuthStore } from '../../stores/auth.store'
import { VoidModal } from './VoidModal'
import { RefundModal } from './RefundModal'
import { TransactionDetailModal } from './TransactionDetailModal'
import type { ITransaction } from '@shared/types/transaction.types'

type FilterStatus = '' | 'completed' | 'voided' | 'refunded'

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusBadge(s: string) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  if (s === 'completed') return `${base} bg-green-100 text-green-700`
  if (s === 'voided') return `${base} bg-red-100 text-red-700`
  if (s === 'refunded') return `${base} bg-yellow-100 text-yellow-700`
  return `${base} bg-gray-100 text-gray-600`
}

const STATUS_TABS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Voided', value: 'voided' },
  { label: 'Refunded', value: 'refunded' }
]

export default function TransactionsPage() {
  const role = useAuthStore(s => s.role)
  const canVoid = role?.permissions.includes('can_void_transaction') ?? false
  const canRefund = role?.permissions.includes('can_refund_transaction') ?? false
  const canReprint = role?.permissions.includes('can_reprint_receipt') ?? false

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 50

  const { data, isLoading, isError } = useTransactions({
    status: statusFilter || undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    page,
    limit: LIMIT
  })

  const { voidMutation, refundMutation } = usePOS()

  const [voidTarget, setVoidTarget] = useState<ITransaction | null>(null)
  const [refundTarget, setRefundTarget] = useState<ITransaction | null>(null)
  const [detailTarget, setDetailTarget] = useState<ITransaction | null>(null)
  const [actionError, setActionError] = useState('')

  const transactions = (data?.data ?? []).filter(t =>
    !search || t.receiptNo.toLowerCase().includes(search.toLowerCase())
  )

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  async function handleVoid(reason: string) {
    if (!voidTarget) return
    setActionError('')
    const result = await voidMutation.mutateAsync({ transactionId: voidTarget._id, reason })
    if (result.success) {
      setVoidTarget(null)
    } else {
      setActionError(result.error ?? 'Failed to void transaction')
    }
  }

  async function handleRefund(reason: string, refundedItems: Array<{ productId: string; quantity: number }>) {
    if (!refundTarget) return
    setActionError('')
    const result = await refundMutation.mutateAsync({ transactionId: refundTarget._id, reason, refundedItems })
    if (result.success) {
      setRefundTarget(null)
    } else {
      setActionError(result.error ?? 'Failed to refund transaction')
    }
  }

  return (
    <div className="p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">Sales history, void, and refund management</p>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {actionError}
          <button className="ml-2 text-red-500 hover:text-red-700" onClick={() => setActionError('')}>×</button>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              statusFilter === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Date filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search receipt number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading transactions…</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 text-sm">Failed to load transactions</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Receipt No</th>
                  <th className="px-6 py-3 text-left font-medium">Date</th>
                  <th className="px-6 py-3 text-right font-medium">Items</th>
                  <th className="px-6 py-3 text-right font-medium">Total</th>
                  <th className="px-6 py-3 text-left font-medium">Payment</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setDetailTarget(t)}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {t.receiptNo}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">
                      {t.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                      ₱{fmt(t.totalAmount)}
                    </td>
                    <td className="px-6 py-3 text-gray-600 capitalize">
                      {t.isSplit ? 'Split' : t.payments[0]?.method ?? '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={statusBadge(t.status)}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {canReprint && (
                          <button
                            onClick={() => setDetailTarget(t)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Reprint
                          </button>
                        )}
                        {canVoid && t.status === 'completed' && (
                          <button
                            onClick={() => { setActionError(''); setVoidTarget(t) }}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Void
                          </button>
                        )}
                        {canRefund && t.status === 'completed' && (
                          <button
                            onClick={() => { setActionError(''); setRefundTarget(t) }}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {voidTarget && (
        <VoidModal
          transaction={voidTarget}
          onConfirm={handleVoid}
          onClose={() => setVoidTarget(null)}
          isLoading={voidMutation.isPending}
        />
      )}
      {refundTarget && (
        <RefundModal
          transaction={refundTarget}
          onConfirm={handleRefund}
          onClose={() => setRefundTarget(null)}
          isLoading={refundMutation.isPending}
        />
      )}
      {detailTarget && (
        <TransactionDetailModal
          transaction={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  )
}
