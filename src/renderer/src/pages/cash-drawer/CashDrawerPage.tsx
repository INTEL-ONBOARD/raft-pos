// src/renderer/src/pages/cash-drawer/CashDrawerPage.tsx
import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { useCashDrawer } from '../../hooks/useCashDrawer'
import { useAuthStore } from '../../stores/auth.store'
import type { ICashDrawer } from '@shared/types/cash-drawer.types'

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatusBadge({ status }: { status: string }) {
  return status === 'open'
    ? <span className="badge-green">Open</span>
    : <span className="badge-gray">Closed</span>
}

function OpenDrawerPanel({ onOpen, isLoading }: { onOpen: (cash: number) => void; isLoading: boolean }) {
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
    <div className="content-card" style={{ maxWidth: '28rem' }}>
      {/* Panel header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
            background: 'rgba(22,163,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Open Cash Drawer</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Set the opening float for this shift</p>
          </div>
        </div>
      </div>

      {/* Panel body */}
      <div style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Opening Cash Float (₱)
            </label>
            <div className="relative">
              <span style={{
                position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, pointerEvents: 'none'
              }}>₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="dark-input w-full"
                style={{ paddingLeft: '2rem', fontSize: '1.125rem', fontWeight: 600 }}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#dc2626' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }} />
                Opening…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Open Drawer
              </span>
            )}
          </button>
        </form>
      </div>
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
    <div className="content-card" style={{ maxWidth: '32rem' }}>
      {/* Panel header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
              background: 'rgba(220,38,38,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Close Cash Drawer</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>End shift &amp; generate Z-Report</p>
            </div>
          </div>
          <StatusBadge status="open" />
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem' }}>
        {/* Opened At chip */}
        <div style={{
          flex: 1, padding: '0.875rem 1rem', borderRadius: '0.75rem',
          background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)'
        }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
            Opened At
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {new Date(drawer.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {new Date(drawer.openedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Opening Cash chip */}
        <div style={{
          flex: 1, padding: '0.875rem 1rem', borderRadius: '0.75rem',
          background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.18)'
        }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(22,163,74,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
            Opening Float
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a', lineHeight: 1.2 }}>
            ₱{fmt(drawer.openingCash)}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'rgba(22,163,74,0.5)', marginTop: '0.2rem' }}>
            Cash in drawer
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Closing Cash Count (₱)
            </label>
            <div className="relative">
              <span style={{
                position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, pointerEvents: 'none'
              }}>₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="dark-input w-full"
                style={{ paddingLeft: '2rem', fontSize: '1.125rem', fontWeight: 600 }}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#dc2626' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }} />
                Closing…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Close Drawer &amp; Generate Z-Report
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CashDrawerPage() {
  const role = useAuthStore(s => s.role)
  const canManage = role?.permissions.includes('can_open_close_drawer') ?? false
  const { openDrawerQuery, drawersQuery, openMutation, closeMutation } = useCashDrawer()

  const [actionError, setActionError] = useState('')

  function printZReport(drawer: ICashDrawer) {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
    function row(label: string, value: string) { return `<div class="row"><span>${esc(label)}</span><span>${esc(value)}</span></div>` }
    function money(n: number | null) { return n !== null ? `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—' }
    win.document.write(`<!DOCTYPE html><html><head><title>Z-Report</title>
<style>body{font-family:monospace;width:300px;margin:0 auto;padding:12px;font-size:12px}
h2{text-align:center;margin:0 0 4px}p{text-align:center;margin:2px 0}
.divider{border-top:1px dashed #000;margin:6px 0}.row{display:flex;justify-content:space-between}
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
<div class="divider"></div>
${row('Expected Cash', money(drawer.expectedCash))}
${row('Closing Cash', money(drawer.closingCash))}
<div class="row bold">${`<span>Variance</span><span style="color:${(drawer.variance ?? 0) < 0 ? 'red' : 'inherit'}">${money(drawer.variance)}</span>`}</div>
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

  const openDrawer = openDrawerQuery.data
  const isOpen = !!openDrawer

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <CreditCard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Cash Drawer</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Manage your shift cash drawer</p>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 space-y-5">

        {/* Permission warning */}
        {!canManage && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(180,83,9,0.08)', border: '1px solid rgba(180,83,9,0.18)', color: '#b45309', borderRadius: '0.75rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            You do not have permission to open or close the cash drawer.
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626', borderRadius: '0.75rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {actionError}
          </div>
        )}

        {/* Drawer status banner */}
        {!openDrawerQuery.isLoading && canManage && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.875rem 1.25rem', borderRadius: '0.875rem',
            background: isOpen ? 'rgba(22,163,74,0.06)' : 'var(--bg-subtle)',
            border: `1px solid ${isOpen ? 'rgba(22,163,74,0.18)' : 'var(--border-subtle)'}`,
          }}>
            <span style={{
              width: '0.625rem', height: '0.625rem', borderRadius: '50%', flexShrink: 0,
              background: isOpen ? '#16a34a' : 'var(--text-muted)',
              boxShadow: isOpen ? '0 0 0 3px rgba(22,163,74,0.15)' : 'none'
            }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: isOpen ? '#16a34a' : 'var(--text-secondary)' }}>
              {isOpen ? 'Drawer is currently OPEN' : 'No active drawer'}
            </span>
            {!isOpen && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Open a new drawer to begin your shift
              </span>
            )}
          </div>
        )}

        {/* Loading state */}
        {openDrawerQuery.isLoading ? (
          <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>
            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-default)', borderTopColor: 'rgba(79,70,229,0.6)' }} />
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

        {/* Drawer history */}
        <div className="content-card">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Drawer History</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>All past shift drawer records</p>
            </div>
            {(drawersQuery.data?.data?.length ?? 0) > 0 && (
              <span className="badge-gray">{drawersQuery.data!.data!.length} records</span>
            )}
          </div>

          {drawersQuery.isLoading ? (
            <div className="flex items-center gap-2.5 p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-default)', borderTopColor: 'rgba(79,70,229,0.6)' }} />
              Loading history…
            </div>
          ) : (drawersQuery.data?.data?.length ?? 0) === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '3rem', height: '3rem', borderRadius: '0.75rem',
                background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1rem'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No drawer records yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Completed shifts will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="dark-table">
                <thead>
                  <tr>
                    <th className="text-left">Opened At</th>
                    <th className="text-left">Closed At</th>
                    <th className="text-right">Opening</th>
                    <th className="text-right">Sales</th>
                    <th className="text-right">Expected</th>
                    <th className="text-right">Closing</th>
                    <th className="text-right">Variance</th>
                    <th className="text-left">Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {drawersQuery.data!.data!.map(d => {
                    const variance = d.variance ?? null
                    const rowBg = variance === null
                      ? 'transparent'
                      : variance < 0
                        ? 'rgba(220,38,38,0.04)'
                        : variance > 0
                          ? 'rgba(180,83,9,0.04)'
                          : 'rgba(22,163,74,0.04)'

                    return (
                      <tr key={d._id} style={{ background: rowBg }}>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {new Date(d.openedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {d.closedAt ? new Date(d.closedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td className="text-right" style={{ color: 'var(--text-primary)' }}>₱{fmt(d.openingCash)}</td>
                        <td className="text-right" style={{ color: 'var(--text-primary)' }}>₱{fmt(d.totalSales)}</td>
                        <td className="text-right" style={{ color: 'var(--text-primary)' }}>
                          {d.expectedCash !== null ? `₱${fmt(d.expectedCash)}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td className="text-right" style={{ color: 'var(--text-primary)' }}>
                          {d.closingCash !== null ? `₱${fmt(d.closingCash)}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td className="text-right">
                          {variance === null ? (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              fontWeight: 600, fontSize: '0.8125rem',
                              color: variance < 0 ? '#dc2626' : variance > 0 ? '#b45309' : '#16a34a'
                            }}>
                              {variance < 0 ? '▼' : variance > 0 ? '▲' : ''}
                              ₱{fmt(Math.abs(variance))}
                            </span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="row-actions">
                          {d.status === 'closed' && (
                            <button
                              onClick={() => printZReport(d)}
                              style={{
                                fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.625rem',
                                borderRadius: '0.375rem', color: 'var(--text-secondary)',
                                background: 'var(--border-subtle)', border: '1px solid var(--border-default)',
                                cursor: 'pointer', transition: 'all 0.15s'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; e.currentTarget.style.color = '#4F46E5'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.2)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)' }}
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
  )
}
