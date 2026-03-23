// src/renderer/src/pages/cash-drawer/CashDrawerPage.tsx
import { useState } from 'react'
import { useCashDrawer } from '../../hooks/useCashDrawer'
import { useAuthStore } from '../../stores/auth.store'
import type { ICashDrawer } from '@shared/types/cash-drawer.types'

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
    }`}>
      {status === 'open' ? 'Open' : 'Closed'}
    </span>
  )
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Open Cash Drawer</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opening Cash (₱)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Opening…' : 'Open Drawer'}
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Close Cash Drawer</h2>
        <StatusBadge status="open" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs">Opened At</p>
          <p className="font-medium">{new Date(drawer.openedAt).toLocaleTimeString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs">Opening Cash</p>
          <p className="font-medium">₱{fmt(drawer.openingCash)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Closing Cash Count (₱)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? 'Closing…' : 'Close Drawer & Generate Z-Report'}
        </button>
      </form>
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
<p>Opened: ${new Date(drawer.openedAt).toLocaleString()}</p>
<p>Closed: ${drawer.closedAt ? new Date(drawer.closedAt).toLocaleString() : '—'}</p>
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
    const result = await openMutation.mutateAsync({ openingCash })
    if (!result.success) setActionError(result.error ?? 'Failed to open drawer')
  }

  async function handleClose(closingCash: number) {
    setActionError('')
    const result = await closeMutation.mutateAsync({ closingCash })
    if (!result.success) {
      setActionError(result.error ?? 'Failed to close drawer')
    } else if (result.data) {
      printZReport(result.data)
    }
  }

  const openDrawer = openDrawerQuery.data
  const isOpen = !!openDrawer

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cash Drawer</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your shift cash drawer</p>
      </div>

      {!canManage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
          You do not have permission to open or close the cash drawer.
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {actionError}
        </div>
      )}

      {openDrawerQuery.isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Drawer History</h2>
        </div>
        {drawersQuery.isLoading ? (
          <div className="p-6 text-gray-400 text-sm">Loading history…</div>
        ) : (drawersQuery.data?.data?.length ?? 0) === 0 ? (
          <div className="p-6 text-gray-400 text-sm">No drawer records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Opened At</th>
                  <th className="px-6 py-3 text-left font-medium">Closed At</th>
                  <th className="px-6 py-3 text-right font-medium">Opening</th>
                  <th className="px-6 py-3 text-right font-medium">Sales</th>
                  <th className="px-6 py-3 text-right font-medium">Expected</th>
                  <th className="px-6 py-3 text-right font-medium">Closing</th>
                  <th className="px-6 py-3 text-right font-medium">Variance</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drawersQuery.data!.data!.map(d => (
                  <tr key={d._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(d.openedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {d.closedAt ? new Date(d.closedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">₱{fmt(d.openingCash)}</td>
                    <td className="px-6 py-3 text-right">₱{fmt(d.totalSales)}</td>
                    <td className="px-6 py-3 text-right">
                      {d.expectedCash !== null ? `₱${fmt(d.expectedCash)}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {d.closingCash !== null ? `₱${fmt(d.closingCash)}` : '—'}
                    </td>
                    <td className={`px-6 py-3 text-right font-medium ${
                      d.variance === null ? 'text-gray-400'
                        : d.variance < 0 ? 'text-red-600'
                        : d.variance > 0 ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {d.variance !== null ? `₱${fmt(d.variance)}` : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
