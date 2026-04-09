// src/renderer/src/pages/cash-drawer/CashDrawerPage.tsx
import { useState } from 'react'
import { CreditCardIcon } from '@heroicons/react/24/outline'
import { useCashDrawer } from '../../hooks/useCashDrawer'
import { useAuthStore } from '../../stores/auth.store'
import type { ICashDrawer } from '@shared/types/cash-drawer.types'

const PAY_OUT_CATEGORIES = [
  { value: 'supplies', label: 'Supplies' },
  { value: 'cod_delivery', label: 'COD Delivery' },
  { value: 'petty_cash', label: 'Petty Cash' },
  { value: 'other', label: 'Other' }
] as const

function PayOutModal({
  drawerId,
  onClose,
  onSubmit,
  isLoading
}: {
  drawerId: string
  onClose: () => void
  onSubmit: (data: {
    drawerId: string
    amount: number
    reason: string
    category: string
    recipient: string
  }) => void
  isLoading: boolean
}) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState<string>('petty_cash')
  const [recipient, setRecipient] = useState('')
  const [err, setErr] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setErr('Enter a valid amount')
      return
    }
    if (!reason.trim()) {
      setErr('Reason is required')
      return
    }
    if (!recipient.trim()) {
      setErr('Recipient is required')
      return
    }
    setErr('')
    onSubmit({
      drawerId,
      amount: amt,
      reason: reason.trim(),
      category,
      recipient: recipient.trim()
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#13131f',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '28px',
          width: '380px',
          maxWidth: 'calc(100vw - 32px)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}
        >
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Record Cash Pay-Out
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Log a cash disbursement from this drawer
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              padding: '4px'
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px'
              }}
            >
              Amount (₱)
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  pointerEvents: 'none'
                }}
              >
                ₱
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="dark-input w-full"
                style={{ paddingLeft: '2rem' }}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px'
              }}
            >
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="dark-input w-full"
            >
              {PAY_OUT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px'
              }}
            >
              Recipient
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Name or vendor"
              className="dark-input w-full"
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '6px'
              }}
            >
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief description"
              className="dark-input w-full"
            />
          </div>

          {err && (
            <p
              style={{
                fontSize: '12px',
                color: '#dc2626',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {err}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              style={{ borderRadius: '10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 disabled:opacity-50"
              style={{ borderRadius: '10px' }}
            >
              {isLoading ? 'Saving…' : 'Record Pay-Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatusBadge({ status }: { status: string }) {
  return status === 'open' ? (
    <span className="badge-green">Open</span>
  ) : (
    <span className="badge-gray">Closed</span>
  )
}

function OpenDrawerPanel({
  onOpen,
  isLoading
}: {
  onOpen: (cash: number) => void
  isLoading: boolean
}) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cash = parseFloat(amount)
    if (isNaN(cash) || cash < 0) {
      setError('Enter a valid opening cash amount')
      return
    }
    setError('')
    onOpen(cash)
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '28px',
        maxWidth: '28rem'
      }}
    >
      {/* Panel header */}
      <div
        style={{
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.625rem',
              background: 'rgba(22,163,74,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.88)',
                margin: 0
              }}
            >
              Open Cash Drawer
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', margin: 0 }}>
              Set the opening float for this shift
            </p>
          </div>
        </div>
      </div>

      {/* Panel body */}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}
          >
            Opening Cash Float (₱)
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.40)',
                fontSize: '0.875rem',
                fontWeight: 600,
                pointerEvents: 'none'
              }}
            >
              ₱
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="dark-input w-full"
              style={{ paddingLeft: '2rem', fontSize: '1.125rem', fontWeight: 600 }}
              autoFocus
            />
          </div>
          {error && (
            <p
              style={{
                fontSize: '12px',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#dc2626',
                margin: 0
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full px-4 py-2.5 font-semibold disabled:opacity-50"
          style={{ borderRadius: '0.625rem' }}
        >
          {isLoading ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
              />
              Opening…
            </span>
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Open Drawer
            </span>
          )}
        </button>
      </form>
    </div>
  )
}

function CloseDrawerPanel({
  drawer,
  onClose,
  isLoading
}: {
  drawer: ICashDrawer
  onClose: (cash: number) => void
  isLoading: boolean
}) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cash = parseFloat(amount)
    if (isNaN(cash) || cash < 0) {
      setError('Enter a valid closing cash amount')
      return
    }
    setError('')
    onClose(cash)
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '28px',
        maxWidth: '32rem'
      }}
    >
      {/* Panel header */}
      <div
        style={{
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.625rem',
                background: 'rgba(220,38,38,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.88)',
                  margin: 0
                }}
              >
                Close Cash Drawer
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', margin: 0 }}>
                End shift &amp; generate Z-Report
              </p>
            </div>
          </div>
          <StatusBadge status="open" />
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {/* Opened At chip */}
        <div
          style={{
            flex: 1,
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}
        >
          <p
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.28)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.375rem',
              margin: 0
            }}
          >
            Opened At
          </p>
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.2,
              margin: 0
            }}
          >
            {new Date(drawer.openedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.40)',
              marginTop: '0.2rem',
              margin: 0
            }}
          >
            {new Date(drawer.openedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Opening Cash chip */}
        <div
          style={{
            flex: 1,
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            background: 'rgba(22,163,74,0.06)',
            border: '1px solid rgba(22,163,74,0.18)'
          }}
        >
          <p
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              color: 'rgba(22,163,74,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.375rem',
              margin: 0
            }}
          >
            Opening Float
          </p>
          <p
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#16a34a',
              lineHeight: 1.2,
              margin: 0
            }}
          >
            ₱{fmt(drawer.openingCash)}
          </p>
          <p
            style={{
              fontSize: '0.7rem',
              color: 'rgba(22,163,74,0.5)',
              marginTop: '0.2rem',
              margin: 0
            }}
          >
            Cash in drawer
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}
          >
            Closing Cash Count (₱)
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.40)',
                fontSize: '0.875rem',
                fontWeight: 600,
                pointerEvents: 'none'
              }}
            >
              ₱
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="dark-input w-full"
              style={{ paddingLeft: '2rem', fontSize: '1.125rem', fontWeight: 600 }}
              autoFocus
            />
          </div>
          {error && (
            <p
              style={{
                fontSize: '12px',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#dc2626',
                margin: 0
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-danger w-full px-4 py-2.5 font-semibold disabled:opacity-50"
          style={{ borderRadius: '0.625rem' }}
        >
          {isLoading ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
              />
              Closing…
            </span>
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Close Drawer &amp; Generate Z-Report
            </span>
          )}
        </button>
      </form>
    </div>
  )
}

export default function CashDrawerPage() {
  const role = useAuthStore((s) => s.role)
  const canManage = role?.permissions.includes('can_open_close_drawer') ?? false
  const canApprovePayouts = role?.permissions.includes('can_approve_payouts') ?? false
  const {
    openDrawerQuery,
    drawersQuery,
    openMutation,
    closeMutation,
    payOutMutation,
    reviewPayOutMutation
  } = useCashDrawer()
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [showPayOut, setShowPayOut] = useState(false)

  const [actionError, setActionError] = useState('')

  function printZReport(drawer: ICashDrawer) {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    function esc(s: string) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }
    function row(label: string, value: string, bold = false) {
      return `<div class="row${bold ? ' bold' : ''}"><span>${esc(label)}</span><span>${esc(value)}</span></div>`
    }
    function money(n: number | null) {
      return n !== null
        ? `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '—'
    }

    const approvedPayOuts = (drawer.payOuts ?? []).filter((p) => p.status === 'approved')
    const totalPayOuts = approvedPayOuts.reduce((s, p) => s + p.amount, 0)
    const payOutRows = approvedPayOuts
      .map(
        (p) =>
          `<div class="row indent"><span>${esc(p.category.replace('_', ' '))} — ${esc(p.recipient)}</span><span>-₱${p.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>`
      )
      .join('')

    win.document.write(`<!DOCTYPE html><html><head><title>Z-Report</title>
<style>body{font-family:monospace;width:300px;margin:0 auto;padding:12px;font-size:12px}
h2{text-align:center;margin:0 0 4px}p{text-align:center;margin:2px 0}
.divider{border-top:1px dashed #000;margin:6px 0}.row{display:flex;justify-content:space-between}
.indent{padding-left:12px;font-size:11px;color:#555}
.bold{font-weight:bold}</style></head><body>
<h2>Z-REPORT</h2>
<p>Opened: ${esc(new Date(drawer.openedAt).toLocaleString())}</p>
<p>Closed: ${drawer.closedAt ? esc(new Date(drawer.closedAt).toLocaleString()) : '—'}</p>
<div class="divider"></div>
${row('Opening Cash', money(drawer.openingCash))}
${row('Cash Sales', money(drawer.totalCash))}
${row('Card Sales', money(drawer.totalCard))}
${row('Mobile Sales', money(drawer.totalMobile))}
${row('Total Sales', money(drawer.totalSales))}
${row('Total Transactions', String(drawer.totalTransactions))}
${
  approvedPayOuts.length > 0
    ? `<div class="divider"></div>
${row('Cash Pay-Outs', `-${money(totalPayOuts)}`)}
${payOutRows}`
    : ''
}
<div class="divider"></div>
${row('Expected Cash', money(drawer.expectedCash))}
${row('Closing Cash', money(drawer.closingCash))}
<div class="row bold"><span>Variance</span><span style="color:${(drawer.variance ?? 0) < 0 ? 'red' : 'inherit'}">${money(drawer.variance)}</span></div>
<div class="divider"></div>
<p>*** END OF SHIFT ***</p>
</body></html>`)
    win.document.close()
    win.print()
  }

  async function handleOpen(openingCash: number) {
    setActionError('')
    try {
      await openMutation.mutateAsync({ openingCash })
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to open drawer')
    }
  }

  async function handleClose(closingCash: number) {
    setActionError('')
    try {
      const result = await closeMutation.mutateAsync({ closingCash })
      if (result.data) printZReport(result.data)
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to close drawer')
    }
  }

  async function handlePayOut(data: {
    drawerId: string
    amount: number
    reason: string
    category: string
    recipient: string
  }) {
    setActionError('')
    try {
      await payOutMutation.mutateAsync(data as any)
      setShowPayOut(false)
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to record pay-out')
    }
  }

  async function handleReview(
    drawerId: string,
    payOutId: string,
    decision: 'approved' | 'rejected'
  ) {
    setActionError('')
    try {
      await reviewPayOutMutation.mutateAsync({ drawerId, payOutId, decision })
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to review pay-out')
    }
  }

  const openDrawer = openDrawerQuery.data
  const isOpen = !!openDrawer

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
      {showPayOut && openDrawer && (
        <PayOutModal
          drawerId={openDrawer._id}
          onClose={() => setShowPayOut(false)}
          onSubmit={handlePayOut}
          isLoading={payOutMutation.isPending}
        />
      )}
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

      {/* All content */}
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
              <CreditCardIcon style={{ width: '18px', height: '18px', color: '#6366f1' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Cash Drawer
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.40)',
                  marginTop: '2px',
                  margin: 0
                }}
              >
                Manage your shift cash drawer
              </p>
            </div>
          </div>
          {isOpen && canManage && (
            <button
              onClick={() => setShowPayOut(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '13px',
                fontWeight: 600,
                padding: '9px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: 'rgba(251,146,60,0.1)',
                border: '1px solid rgba(251,146,60,0.2)',
                color: '#fb923c',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251,146,60,0.18)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(251,146,60,0.1)'
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Pay-Out
            </button>
          )}
        </div>

        {/* Content area */}
        <div
          style={{
            padding: '0 36px 36px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Permission warning */}
          {!canManage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                background: 'rgba(251,191,36,0.07)',
                border: '1px solid rgba(251,191,36,0.15)',
                color: '#fbbf24'
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              You do not have permission to open or close the cash drawer.
            </div>
          )}

          {/* Action error */}
          {actionError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.15)',
                color: '#dc2626'
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {actionError}
            </div>
          )}

          {/* Drawer status banner */}
          {!openDrawerQuery.isLoading && canManage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                borderRadius: '14px',
                background: isOpen ? 'rgba(22,163,74,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isOpen ? 'rgba(22,163,74,0.18)' : 'rgba(255,255,255,0.07)'}`
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: isOpen ? '#16a34a' : 'rgba(255,255,255,0.40)',
                  boxShadow: isOpen ? '0 0 0 3px rgba(22,163,74,0.15)' : 'none'
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isOpen ? '#16a34a' : 'rgba(255,255,255,0.65)'
                }}
              >
                {isOpen ? 'Drawer is currently OPEN' : 'No active drawer'}
              </span>
              {!isOpen && (
                <span
                  style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', marginLeft: 'auto' }}
                >
                  Open a new drawer to begin your shift
                </span>
              )}
            </div>
          )}

          {/* Loading state */}
          {openDrawerQuery.isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.40)',
                padding: '8px 0'
              }}
            >
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{
                  borderColor: 'rgba(255,255,255,0.10)',
                  borderTopColor: 'rgba(99,102,241,0.6)'
                }}
              />
              Loading drawer status…
            </div>
          ) : canManage ? (
            isOpen ? (
              <CloseDrawerPanel
                drawer={openDrawer!}
                onClose={handleClose}
                isLoading={closeMutation.isPending}
              />
            ) : (
              <OpenDrawerPanel onOpen={handleOpen} isLoading={openMutation.isPending} />
            )
          ) : null}

          {/* Pay-outs list for open drawer */}
          {isOpen && openDrawer && (openDrawer.payOuts ?? []).length > 0 && (
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                overflow: 'hidden',
                maxWidth: '32rem'
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.88)',
                    margin: 0
                  }}
                >
                  Cash Pay-Outs This Shift
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(251,146,60,0.1)',
                    color: '#fb923c',
                    border: '1px solid rgba(251,146,60,0.2)'
                  }}
                >
                  {openDrawer.payOuts.filter((p) => p.status === 'approved').length} approved
                </span>
              </div>
              <div style={{ padding: '8px 0' }}>
                {openDrawer.payOuts.map((p) => (
                  <div
                    key={p._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.85)',
                          marginBottom: '2px'
                        }}
                      >
                        {p.reason}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {p.category.replace('_', ' ')} · {p.recipient}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fb923c' }}>
                      -₱{fmt(p.amount)}
                    </div>
                    {p.status === 'pending' && canApprovePayouts ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleReview(openDrawer._id, p._id, 'approved')}
                          disabled={reviewPayOutMutation.isPending}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'rgba(22,163,74,0.1)',
                            border: '1px solid rgba(22,163,74,0.2)',
                            color: '#16a34a'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(openDrawer._id, p._id, 'rejected')}
                          disabled={reviewPayOutMutation.isPending}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'rgba(220,38,38,0.08)',
                            border: '1px solid rgba(220,38,38,0.2)',
                            color: '#dc2626'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '5px',
                          background:
                            p.status === 'approved'
                              ? 'rgba(22,163,74,0.1)'
                              : p.status === 'rejected'
                                ? 'rgba(220,38,38,0.1)'
                                : 'rgba(251,191,36,0.1)',
                          color:
                            p.status === 'approved'
                              ? '#16a34a'
                              : p.status === 'rejected'
                                ? '#dc2626'
                                : '#fbbf24',
                          border: `1px solid ${p.status === 'approved' ? 'rgba(22,163,74,0.2)' : p.status === 'rejected' ? 'rgba(220,38,38,0.2)' : 'rgba(251,191,36,0.2)'}`,
                          textTransform: 'capitalize'
                        }}
                      >
                        {p.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drawer history */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.88)',
                    margin: 0
                  }}
                >
                  Drawer History
                </h2>
                <p
                  style={{
                    fontSize: '12px',
                    marginTop: '2px',
                    color: 'rgba(255,255,255,0.40)',
                    margin: 0
                  }}
                >
                  All past shift drawer records
                </p>
              </div>
              {(drawersQuery.data?.data?.length ?? 0) > 0 && (
                <span className="badge-gray">{drawersQuery.data!.data!.length} records</span>
              )}
            </div>

            {drawersQuery.isLoading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '24px',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.40)'
                }}
              >
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'rgba(255,255,255,0.10)',
                    borderTopColor: 'rgba(99,102,241,0.6)'
                  }}
                />
                Loading history…
              </div>
            ) : (drawersQuery.data?.data?.length ?? 0) === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.65)',
                    margin: 0
                  }}
                >
                  No drawer records yet
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    marginTop: '4px',
                    color: 'rgba(255,255,255,0.40)',
                    margin: 0
                  }}
                >
                  Completed shifts will appear here
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {[
                        'Opened At',
                        'Closed At',
                        'Opening',
                        'Sales',
                        'Expected',
                        'Closing',
                        'Variance',
                        'Status',
                        ''
                      ].map((h, hi) => (
                        <th
                          key={h + hi}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            color: 'rgba(255,255,255,0.28)',
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '10px 16px',
                            textAlign: hi >= 2 && hi <= 6 ? 'right' : 'left',
                            borderBottom: '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drawersQuery.data!.data!.map((d, idx) => {
                      const variance = d.variance ?? null
                      const rowBg =
                        variance === null
                          ? 'transparent'
                          : variance < 0
                            ? 'rgba(220,38,38,0.04)'
                            : variance > 0
                              ? 'rgba(251,191,36,0.03)'
                              : 'rgba(22,163,74,0.04)'
                      const isLast = idx === drawersQuery.data!.data!.length - 1

                      return (
                        <tr
                          key={d._id}
                          onMouseEnter={() => setHoveredRow(d._id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            background: hoveredRow === d._id ? 'rgba(255,255,255,0.03)' : rowBg
                          }}
                        >
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              fontSize: '13px',
                              color: 'rgba(255,255,255,0.65)'
                            }}
                          >
                            {new Date(d.openedAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              fontSize: '13px',
                              color: 'rgba(255,255,255,0.65)'
                            }}
                          >
                            {d.closedAt ? (
                              new Date(d.closedAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.28)' }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              fontSize: '13px',
                              color: 'rgba(255,255,255,0.88)',
                              textAlign: 'right'
                            }}
                          >
                            ₱{fmt(d.openingCash)}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              fontSize: '13px',
                              color: 'rgba(255,255,255,0.88)',
                              textAlign: 'right'
                            }}
                          >
                            ₱{fmt(d.totalSales)}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              fontSize: '13px',
                              color: 'rgba(255,255,255,0.88)',
                              textAlign: 'right'
                            }}
                          >
                            {d.expectedCash !== null ? (
                              `₱${fmt(d.expectedCash)}`
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.28)' }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              fontSize: '13px',
                              color: 'rgba(255,255,255,0.88)',
                              textAlign: 'right'
                            }}
                          >
                            {d.closingCash !== null ? (
                              `₱${fmt(d.closingCash)}`
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.28)' }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              fontSize: '13px',
                              textAlign: 'right'
                            }}
                          >
                            {variance === null ? (
                              <span style={{ color: 'rgba(255,255,255,0.28)' }}>—</span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 600,
                                  fontSize: '13px',
                                  color:
                                    variance < 0 ? '#dc2626' : variance > 0 ? '#fbbf24' : '#16a34a'
                                }}
                              >
                                {variance < 0 ? '▼' : variance > 0 ? '▲' : ''}₱
                                {fmt(Math.abs(variance))}
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              fontSize: '13px'
                            }}
                          >
                            <StatusBadge status={d.status} />
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                              fontSize: '13px'
                            }}
                          >
                            {d.status === 'closed' && (
                              <button
                                onClick={() => printZReport(d)}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  color: 'rgba(255,255,255,0.65)',
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.10)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
                                  e.currentTarget.style.color = '#6366f1'
                                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                                }}
                              >
                                Z-Report
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
