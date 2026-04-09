// src/renderer/src/pages/purchase-orders/PurchaseOrdersPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  PaperAirplaneIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline'
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
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  useSuppliers()
  const { suppliers } = useSupplierStore()
  const supplierMap = Object.fromEntries(suppliers.map((s) => [s._id, s.name]))

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
              <ClipboardDocumentListIcon
                style={{ width: '18px', height: '18px', color: '#6366f1' }}
              />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Purchase Orders
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.40)',
                  marginTop: '2px',
                  margin: 0
                }}
              >
                {total} order{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/purchase-orders/new')}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <PlusIcon style={{ width: '16px', height: '16px' }} /> Create PO
          </button>
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
                padding: '12px 16px',
                fontSize: '14px',
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
                onClick={() => setActionError('')}
                style={{
                  marginLeft: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
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
                onClick={() => setActiveTab(tab.value)}
                className="px-3 py-1.5 text-sm font-medium rounded-full transition-all"
                style={
                  activeTab === tab.value
                    ? { background: '#6366f1', color: '#ffffff', border: 'none' }
                    : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.65)'
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table container */}
          {query.isLoading ? (
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['PO Number', 'Supplier', 'Status', 'Total', 'Created', ''].map((h) => (
                      <th
                        key={h}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          color: 'rgba(255,255,255,0.28)',
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '10px 16px',
                          textAlign: 'left',
                          borderBottom: '1px solid rgba(255,255,255,0.06)'
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td
                          key={j}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          <div
                            className="animate-pulse"
                            style={{
                              height: '16px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.07)',
                              width: j === 0 ? '100px' : j === 1 ? '110px' : '80px'
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : orders.length === 0 ? (
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
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '64px 24px',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ClipboardDocumentListIcon
                    style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.28)' }}
                  />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.65)',
                      margin: 0
                    }}
                  >
                    No purchase orders found
                  </p>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.40)',
                      marginTop: '4px',
                      margin: 0
                    }}
                  >
                    Try adjusting your search or filters.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['PO Number', 'Supplier', 'Status', 'Total', 'Created', ''].map((h, hi) => (
                      <th
                        key={h}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          color: 'rgba(255,255,255,0.28)',
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '10px 16px',
                          textAlign: hi === 3 ? 'right' : 'left',
                          borderBottom: '1px solid rgba(255,255,255,0.06)'
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((po, idx) => {
                    const isLast = idx === orders.length - 1
                    return (
                      <tr
                        key={po._id}
                        onMouseEnter={() => setHoveredRow(po._id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          background:
                            hoveredRow === po._id ? 'rgba(255,255,255,0.03)' : 'transparent'
                        }}
                      >
                        <td
                          style={{
                            padding: '12px 16px',
                            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.88)',
                            fontWeight: 500,
                            fontFamily: 'monospace'
                          }}
                        >
                          {po.poNumber}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.65)'
                          }}
                        >
                          {supplierMap[po.supplierId] ?? '—'}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                            fontSize: '13px'
                          }}
                        >
                          <span className={STATUS_BADGE[po.status]}>
                            {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.88)',
                            fontWeight: 500,
                            textAlign: 'right'
                          }}
                        >
                          ₱{po.totalAmount.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.65)'
                          }}
                        >
                          {new Date(po.createdAt).toLocaleDateString()}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                            fontSize: '13px'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '4px'
                            }}
                          >
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
                                style={{
                                  padding: '6px',
                                  borderRadius: '8px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'rgba(255,255,255,0.40)',
                                  transition: 'color 0.15s'
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color = 'rgba(255,255,255,0.88)')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')
                                }
                                title="Mark as Sent"
                                aria-label="Mark as Sent"
                              >
                                <PaperAirplaneIcon style={{ width: '16px', height: '16px' }} />
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
                                style={{
                                  padding: '6px',
                                  borderRadius: '8px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'rgba(255,255,255,0.40)',
                                  transition: 'color 0.15s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')
                                }
                                title="Cancel"
                                aria-label="Cancel purchase order"
                              >
                                <NoSymbolIcon style={{ width: '16px', height: '16px' }} />
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

          {receivePO && <ReceivePOModal po={receivePO} onClose={() => setReceivePO(null)} />}
        </div>
      </div>
    </div>
  )
}
