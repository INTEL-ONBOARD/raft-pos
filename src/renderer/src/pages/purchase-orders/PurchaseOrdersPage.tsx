// src/renderer/src/pages/purchase-orders/PurchaseOrdersPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Send, Ban, ClipboardList } from 'lucide-react'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { useSupplierStore } from '../../stores/supplier.store'
import { useSuppliers } from '../../hooks/useSuppliers'
import { ReceivePOModal } from './ReceivePOModal'
import type { IPurchaseOrder, POStatus } from '@shared/types/purchase-order.types'

const STATUS_TABS: Array<{ label: string; value: POStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Partial', value: 'partial' },
  { label: 'Received', value: 'received' },
  { label: 'Cancelled', value: 'cancelled' }
]

const STATUS_BADGE: Record<POStatus, string> = {
  draft: 'badge-gray',
  sent: 'badge-blue',
  partial: 'badge-yellow',
  received: 'badge-green',
  cancelled: 'badge-red'
}

export default function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<POStatus | 'all'>('all')
  const [receivePO, setReceivePO] = useState<IPurchaseOrder | null>(null)
  const [actionError, setActionError] = useState('')

  useSuppliers()
  const { suppliers } = useSupplierStore()
  const supplierMap = Object.fromEntries(suppliers.map(s => [s._id, s.name]))

  const { query, send, cancel } = usePurchaseOrders({
    status: activeTab === 'all' ? undefined : activeTab
  })
  const orders = query.data?.data ?? []
  const total = query.data?.total ?? 0

  async function handleSend(po: IPurchaseOrder) {
    if (!confirm(`Mark "${po.poNumber}" as Sent?`)) return
    setActionError('')
    try {
      await send.mutateAsync(po._id)
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to send purchase order')
    }
  }

  async function handleCancel(po: IPurchaseOrder) {
    if (!confirm(`Cancel "${po.poNumber}"? This cannot be undone.`)) return
    setActionError('')
    try {
      await cancel.mutateAsync(po._id)
    } catch (err: any) {
      setActionError(err.message ?? 'Failed to cancel purchase order')
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <ClipboardList className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Purchase Orders</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{total} order{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/purchase-orders/new')}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>
      <div className="p-6 flex-1 space-y-4">

      {actionError && (
        <div className="px-4 py-3 text-sm flex items-center justify-between rounded-xl"
          style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626' }}>
          {actionError}
          <button onClick={() => setActionError('')} className="ml-2 hover:opacity-70">×</button>
        </div>
      )}

      {/* Status filter tabs — pill toggle */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className="px-3 py-1.5 text-sm font-medium rounded-full transition-all"
            style={activeTab === tab.value
              ? { background: 'var(--accent)', color: '#ffffff', border: 'none' }
              : { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="content-card overflow-hidden">
          <table className="dark-table">
            <thead>
              <tr>
                <th className="text-left">PO Number</th>
                <th className="text-left">Supplier</th>
                <th className="text-left">Status</th>
                <th className="text-right">Total</th>
                <th className="text-left">Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}>
                      <div className="h-4 rounded animate-pulse" style={{ background: 'var(--border-subtle)', width: j === 0 ? '100px' : j === 1 ? '110px' : '80px' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : orders.length === 0 ? (
        <div className="content-card overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <ClipboardList className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="text-center">
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No purchase orders found</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Try adjusting your search or filters.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="content-card overflow-hidden">
          <table className="dark-table">
            <thead>
              <tr>
                <th className="text-left">PO Number</th>
                <th className="text-left">Supplier</th>
                <th className="text-left">Status</th>
                <th className="text-right">Total</th>
                <th className="text-left">Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map(po => (
                <tr key={po._id}>
                  <td className="font-medium font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{po.poNumber}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{supplierMap[po.supplierId] ?? '—'}</td>
                  <td>
                    <span className={STATUS_BADGE[po.status]}>
                      {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                    </span>
                  </td>
                  <td className="text-right font-medium" style={{ color: 'var(--text-primary)' }}>₱{po.totalAmount.toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(po.createdAt).toLocaleDateString()}</td>
                  <td className="row-actions">
                    <div className="flex items-center justify-end gap-1">
                      {po.status === 'draft' && (
                        <button
                          onClick={() => navigate(`/purchase-orders/${po._id}/edit`)}
                          className="btn-secondary px-3 py-1 text-xs font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {po.status === 'draft' && (
                        <button
                          onClick={() => handleSend(po)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Mark as Sent"
                          aria-label="Mark as Sent"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {(po.status === 'sent' || po.status === 'partial') && (
                        <button
                          onClick={() => setReceivePO(po)}
                          className="btn-primary px-3 py-1 text-xs font-medium"
                        >
                          Receive
                        </button>
                      )}
                      {(po.status === 'draft' || po.status === 'sent') && (
                        <button
                          onClick={() => handleCancel(po)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Cancel"
                          aria-label="Cancel purchase order"
                        >
                          <Ban className="w-4 h-4" />
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

      {receivePO && (
        <ReceivePOModal
          po={receivePO}
          onClose={() => setReceivePO(null)}
        />
      )}
      </div>
    </div>
  )
}
