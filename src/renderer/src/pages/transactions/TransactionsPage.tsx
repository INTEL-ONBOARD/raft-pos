// src/renderer/src/pages/transactions/TransactionsPage.tsx
import { useState } from 'react'
import { Search, ArrowLeftRight } from 'lucide-react'
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
  if (s === 'completed') return 'badge-green'
  if (s === 'voided') return 'badge-red'
  if (s === 'refunded') return 'badge-yellow'
  return 'badge-gray'
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
    try {
      await voidMutation.mutateAsync({ transactionId: voidTarget._id, reason })
      setVoidTarget(null)
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to void transaction')
    }
  }

  async function handleRefund(reason: string, refundedItems: Array<{ productId: string; quantity: number }>) {
    if (!refundTarget) return
    setActionError('')
    try {
      await refundMutation.mutateAsync({ transactionId: refundTarget._id, reason, refundedItems })
      setRefundTarget(null)
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to refund transaction')
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <ArrowLeftRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Transactions</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Sales history, void, and refund management</p>
          </div>
        </div>
      </div>
      <div className="p-6 flex-1 space-y-4">

      {actionError && (
        <div className="p-3 text-sm flex items-center justify-between rounded-xl"
          style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626' }}>
          {actionError}
          <button className="ml-2 hover:opacity-70" onClick={() => setActionError('')}>×</button>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className="px-4 py-2 text-sm font-medium -mb-px transition-colors"
            style={statusFilter === tab.value
              ? { borderBottom: '2px solid #4F46E5', color: '#4F46E5' }
              : { color: 'var(--text-muted)', borderBottom: '2px solid transparent' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Date filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search receipt number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="dark-input pl-9 pr-4 py-2 text-sm w-52"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label style={{ color: 'var(--text-secondary)' }}>From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            className="dark-input px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label style={{ color: 'var(--text-secondary)' }}>To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }}
            className="dark-input px-3 py-2 text-sm"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
            className="text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Table */}
      <div className="content-card overflow-hidden">
        {isLoading ? (
          <table className="dark-table">
            <thead>
              <tr>
                <th className="text-left">Receipt No</th>
                <th className="text-left">Date</th>
                <th className="text-right">Items</th>
                <th className="text-right">Total</th>
                <th className="text-left">Payment</th>
                <th className="text-left">Status</th>
                <th className="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}>
                      <div className="h-4 rounded animate-pulse" style={{ background: 'var(--border-subtle)', width: j === 0 ? '100px' : j === 1 ? '130px' : '70px' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : isError ? (
          <div className="p-8 text-center text-sm" style={{ color: '#dc2626' }}>Failed to load transactions</div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <ArrowLeftRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="text-center">
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No transactions found</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th className="text-left">Receipt No</th>
                  <th className="text-left">Date</th>
                  <th className="text-right">Items</th>
                  <th className="text-right">Total</th>
                  <th className="text-left">Payment</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t._id}>
                    <td>
                      <button
                        onClick={() => setDetailTarget(t)}
                        className="font-medium transition-colors"
                        style={{ color: '#4F46E5' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#4338CA')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#4F46E5')}
                      >
                        {t.receiptNo}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="text-right" style={{ color: 'var(--text-secondary)' }}>
                      {t.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                      ₱{fmt(t.totalAmount)}
                    </td>
                    <td className="capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {t.isSplit ? 'Split' : t.payments[0]?.method ?? '—'}
                    </td>
                    <td>
                      <span className={statusBadge(t.status)}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                    </td>
                    <td className="row-actions">
                      <div className="flex items-center gap-2">
                        {canReprint && (
                          <button
                            onClick={() => setDetailTarget(t)}
                            className="text-xs transition-colors"
                            aria-label={`Reprint receipt for ${t.receiptNo}`}
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#4F46E5')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            Reprint
                          </button>
                        )}
                        {canVoid && t.status === 'completed' && (
                          <button
                            onClick={() => { setActionError(''); setVoidTarget(t) }}
                            className="text-xs transition-colors"
                            aria-label={`Void transaction ${t.receiptNo}`}
                            style={{ color: '#dc2626' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#b91c1c')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#dc2626')}
                          >
                            Void
                          </button>
                        )}
                        {canRefund && t.status === 'completed' && (
                          <button
                            onClick={() => { setActionError(''); setRefundTarget(t) }}
                            className="text-xs transition-colors"
                            aria-label={`Refund transaction ${t.receiptNo}`}
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
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
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="btn-secondary px-3 py-1 rounded disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary px-3 py-1 rounded disabled:opacity-40"
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
    </div>
  )
}
