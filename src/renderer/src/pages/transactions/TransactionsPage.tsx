// src/renderer/src/pages/transactions/TransactionsPage.tsx
import { useState } from 'react'
import { MagnifyingGlassIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { useTransactions, usePOS } from '../../hooks/usePOS'
import { useAuthStore } from '../../stores/auth.store'
import { VoidModal } from './VoidModal'
import { RefundModal } from './RefundModal'
import { TransactionDetailModal } from './TransactionDetailModal'
import type { ITransaction } from '@shared/types/transaction.types'

type FilterStatus = '' | 'completed' | 'voided' | 'refunded' | 'partially_refunded'

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusBadge(s: string) {
  if (s === 'completed') return 'badge-green'
  if (s === 'voided') return 'badge-red'
  if (s === 'refunded') return 'badge-yellow'
  if (s === 'partially_refunded') return 'badge-yellow'
  return 'badge-gray'
}

const STATUS_TABS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Voided', value: 'voided' },
  { label: 'Partial Refunds', value: 'partially_refunded' },
  { label: 'Refunded', value: 'refunded' }
]

export default function TransactionsPage() {
  const role = useAuthStore((s) => s.role)
  const canVoid = role?.permissions.includes('can_void_transaction') ?? false
  const canRefund = role?.permissions.includes('can_refund_transaction') ?? false
  const canReprint = role?.permissions.includes('can_reprint_receipt') ?? false

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
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

  const transactions = (data?.data ?? []).filter(
    (t) => !search || t.receiptNo.toLowerCase().includes(search.toLowerCase())
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

  async function handleRefund(
    reason: string,
    refundedItems: Array<{ productId: string; quantity: number }>
  ) {
    if (!refundTarget) return
    setActionError('')
    try {
      await refundMutation.mutateAsync({ transactionId: refundTarget._id, reason, refundedItems })
      setRefundTarget(null)
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to refund transaction')
    }
  }

  const thStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    color: 'rgba(255,255,255,0.28)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '10px 16px',
    textAlign: 'left',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  }

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.65)'
  }

  const tdLastStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.65)'
  }

  return (
    <div
      style={{
        background: '#080810',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%'
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)'
        }}
      />

      {/* Content wrapper */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
      >
        {/* Page header */}
        <div
          style={{
            padding: '28px 36px 20px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                background: 'rgba(99,102,241,0.12)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ArrowsRightLeftIcon style={{ width: '18px', height: '18px', color: '#a5b4fc' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Transactions
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.40)',
                  marginTop: '2px',
                  marginBottom: 0
                }}
              >
                Sales history, void, and refund management
              </p>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div
          style={{
            padding: '0 36px 36px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {actionError && (
            <div
              style={{
                padding: '12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '12px',
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.15)',
                color: '#dc2626'
              }}
            >
              {actionError}
              <button
                style={{
                  marginLeft: '8px',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '16px'
                }}
                onClick={() => setActionError('')}
              >
                ×
              </button>
            </div>
          )}

          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value)
                  setPage(1)
                }}
                style={
                  statusFilter === tab.value
                    ? {
                        height: '32px',
                        borderRadius: '999px',
                        padding: '0 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: 'rgba(99,102,241,0.15)',
                        border: '1px solid rgba(99,102,241,0.30)',
                        color: '#a5b4fc',
                        cursor: 'pointer'
                      }
                    : {
                        height: '32px',
                        borderRadius: '999px',
                        padding: '0 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.45)',
                        cursor: 'pointer'
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Date filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlassIcon
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: 'rgba(255,255,255,0.35)'
                }}
              />
              <input
                type="text"
                placeholder="Search receipt number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dark-input"
                style={{
                  paddingLeft: '36px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  fontSize: '13px',
                  width: '208px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <label style={{ color: 'rgba(255,255,255,0.50)' }}>From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className="dark-input"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <label style={{ color: 'rgba(255,255,255,0.50)' }}>To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                className="dark-input"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setPage(1)
                }}
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.40)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.80)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')}
              >
                Clear dates
              </button>
            )}
          </div>

          {/* Table container */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            {isLoading ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Receipt No', 'Date', 'Items', 'Total', 'Payment', 'Status', 'Actions'].map(
                      (h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} style={tdStyle}>
                          <div
                            className="animate-pulse"
                            style={{
                              height: '14px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.06)',
                              width: j === 0 ? '100px' : j === 1 ? '130px' : '70px'
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : isError ? (
              <div
                style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: '#dc2626' }}
              >
                Failed to load transactions
              </div>
            ) : transactions.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '64px 0',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)'
                  }}
                >
                  <ArrowsRightLeftIcon
                    style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.30)' }}
                  />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.60)',
                      margin: 0
                    }}
                  >
                    No transactions found
                  </p>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.35)',
                      marginTop: '4px',
                      marginBottom: 0
                    }}
                  >
                    Try adjusting your search or filters.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Receipt No</th>
                      <th style={thStyle}>Date</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Items</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                      <th style={thStyle}>Payment</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => {
                      const isLast = idx === transactions.length - 1
                      const isHovered = hoveredRow === t._id
                      const rowTd: React.CSSProperties = {
                        ...(isLast ? tdLastStyle : tdStyle),
                        background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent'
                      }
                      return (
                        <tr
                          key={t._id}
                          onMouseEnter={() => setHoveredRow(t._id)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td style={rowTd}>
                            <button
                              onClick={() => setDetailTarget(t)}
                              style={{
                                color: '#818cf8',
                                fontWeight: 500,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#818cf8')}
                            >
                              {t.receiptNo}
                            </button>
                          </td>
                          <td style={{ ...rowTd, color: 'rgba(255,255,255,0.55)' }}>
                            {new Date(t.createdAt).toLocaleString()}
                          </td>
                          <td
                            style={{
                              ...rowTd,
                              textAlign: 'right',
                              color: 'rgba(255,255,255,0.55)'
                            }}
                          >
                            {t.items.reduce((s, i) => s + i.quantity, 0)}
                          </td>
                          <td
                            style={{
                              ...rowTd,
                              textAlign: 'right',
                              color: 'rgba(255,255,255,0.88)',
                              fontWeight: 500
                            }}
                          >
                            ₱{fmt(t.totalAmount)}
                          </td>
                          <td
                            style={{
                              ...rowTd,
                              textTransform: 'capitalize',
                              color: 'rgba(255,255,255,0.55)'
                            }}
                          >
                            {t.isSplit ? 'Split' : (t.payments[0]?.method ?? '—')}
                          </td>
                          <td style={rowTd}>
                            <span className={statusBadge(t.status)}>
                              {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                            </span>
                          </td>
                          <td style={rowTd}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {canReprint && (
                                <button
                                  onClick={() => setDetailTarget(t)}
                                  aria-label={`Reprint receipt for ${t.receiptNo}`}
                                  style={{
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.40)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')
                                  }
                                >
                                  Reprint
                                </button>
                              )}
                              {canVoid && t.status === 'completed' && (
                                <button
                                  onClick={() => {
                                    setActionError('')
                                    setVoidTarget(t)
                                  }}
                                  aria-label={`Void transaction ${t.receiptNo}`}
                                  style={{
                                    fontSize: '12px',
                                    color: '#dc2626',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#b91c1c')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = '#dc2626')}
                                >
                                  Void
                                </button>
                              )}
                              {canRefund && t.status === 'completed' && (
                                <button
                                  onClick={() => {
                                    setActionError('')
                                    setRefundTarget(t)
                                  }}
                                  aria-label={`Refund transaction ${t.receiptNo}`}
                                  style={{
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.55)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = 'rgba(255,255,255,0.88)')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')
                                  }
                                >
                                  Refund
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.50)'
              }}
            >
              <span>
                Page {page} of {totalPages} ({total} total)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary"
                  style={{ padding: '4px 12px', borderRadius: '6px' }}
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary"
                  style={{ padding: '4px 12px', borderRadius: '6px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
        <TransactionDetailModal transaction={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
    </div>
  )
}
