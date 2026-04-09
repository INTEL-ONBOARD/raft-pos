import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  PaperAirplaneIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  PencilSquareIcon,
  DocumentCheckIcon
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

const STATUS_COLORS: Record<POStatus, { bg: string; color: string; border: string }> = {
  draft: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' },
  sent: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: 'rgba(56,189,248,0.2)' },
  partial: { bg: 'rgba(250,204,21,0.1)', color: '#facc15', border: 'rgba(250,204,21,0.2)' },
  received: { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' },
  cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' }
}

/* ─── Stat Card ─────────────────────────────────────────────────────── */
interface StatCardProps { label: string; value: number | string; sub?: string; icon: React.ReactNode; accent: string; accentBg: string; highlight?: boolean; hlColor?: string; onClick?: () => void }
function StatCard({ label, value, sub, icon, accent, accentBg, highlight, hlColor, onClick }: StatCardProps) {
  const [hov, setHov] = useState(false)
  const active = highlight && Number(value) > 0
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)', border: `1px solid ${active ? (hlColor ?? accent) + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: '14px', padding: '18px 20px', cursor: onClick ? 'pointer' : 'default', transition: 'all 180ms ease', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-24px', right: '-16px', width: '80px', height: '80px', borderRadius: '50%', background: accentBg, filter: 'blur(28px)', pointerEvents: 'none', opacity: active ? 1 : 0.45 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: accent }}>{icon}</div>
        </div>
      </div>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: '0 0 4px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, margin: 0, lineHeight: 1, color: active ? (hlColor ?? accent) : '#fff' }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', margin: '5px 0 0' }}>{sub}</p>}
    </div>
  )
}

function TH({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
   return (
      <th style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.28)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 14px', textAlign: align, borderBottom: '1px solid rgba(255,255,255,0.055)', whiteSpace: 'nowrap' }}>
         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
            {children}
         </span>
      </th>
   )
}

export default function PurchaseOrdersPage() {
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<POStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<IPurchaseOrder | null>(null)
  const [receivePO, setReceivePO] = useState<IPurchaseOrder | null>(null)
  const [actionError, setActionError] = useState('')

  useSuppliers()
  const { suppliers } = useSupplierStore()
  const supplierMap = Object.fromEntries(suppliers.map((s) => [s._id, s.name]))

  const { query, send, cancel } = usePurchaseOrders({ status: activeTab === 'all' ? undefined : activeTab })
  const orders = query.data?.data ?? []
  
  // Calculate quick stats across all orders, not just paginated/filtered
  // For precise stats, we'd use a separate endpoint. We will approximate since we loaded them locally.
  const allOrdersStats = usePurchaseOrders({}).query.data?.data ?? []
  const draftCount = allOrdersStats.filter(o => o.status === 'draft').length
  const sentCount = allOrdersStats.filter(o => o.status === 'sent').length
  const receivedCount = allOrdersStats.filter(o => o.status === 'received' || o.status === 'partial').length

  const filtered = useMemo(() => {
     return orders.filter(o => {
        if (search) {
           const supName = (supplierMap[o.supplierId] || '').toLowerCase()
           if (!o.poNumber.toLowerCase().includes(search.toLowerCase()) && !supName.includes(search.toLowerCase())) return false
        }
        return true
     })
  }, [orders, search, supplierMap])

  async function handleSend(po: IPurchaseOrder) {
    if (!confirm(`Mark "${po.poNumber}" as Sent?`)) return
    setActionError('')
    try { await send.mutateAsync(po._id) }
    catch (err: any) { setActionError(err.message ?? 'Failed to send purchase order') }
  }

  async function handleCancel(po: IPurchaseOrder) {
    if (!confirm(`Cancel "${po.poNumber}"? This cannot be undone.`)) return
    setActionError('')
    try { await cancel.mutateAsync(po._id) }
    catch (err: any) { setActionError(err.message ?? 'Failed to cancel purchase order') }
  }

  const liveSelected = selectedRow ? (orders.find(r => r._id === selectedRow._id) ?? selectedRow) : null

  function RightPanel() {
      if (!liveSelected) {
         return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ padding: '20px 20px 0' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>PO Overview</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>Select an order to view details</p>
               </div>
               <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>Quick Actions</p>
                  <button onClick={() => navigate('/purchase-orders/new')} style={{ padding: '12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', color: '#818cf8', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'background 150ms', width: '100%' }}>
                     <PlusIcon style={{ width: '16px' }} /> Create New Purchase Order
                  </button>
               </div>
            </div>
         )
      }

      const po = liveSelected
      const statColor = STATUS_COLORS[po.status]
      const totalItems = po.items.reduce((acc, item) => acc + item.orderedQty, 0)
      const receivedItems = po.items.reduce((acc, item) => acc + item.receivedQty, 0)

      return (
         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
               <button onClick={() => setSelectedRow(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ← Order List
               </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
               <div style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '14px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                     <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'monospace' }}>{po.poNumber}</p>
                     <span style={{ padding: '4px 10px', background: statColor.bg, color: statColor.color, borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: `1px solid ${statColor.border}`, textTransform: 'capitalize' }}>
                        {po.status}
                     </span>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', margin: '0 0 16px' }}>₱{po.totalAmount.toFixed(2)}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                     <BuildingOfficeIcon style={{ width: 16 }} />
                     <span style={{ fontWeight: 500, color: '#fff' }}>{supplierMap[po.supplierId] ?? 'Unknown Supplier'}</span>
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Order Details</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {[
                        { label: 'Date Created', value: new Date(po.createdAt).toLocaleDateString() },
                        { label: 'Total Items', value: `${totalItems} ordered` },
                        { label: 'Received Items', value: `${receivedItems} received` }
                     ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                           <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                           <span style={{ fontSize: '12px', color: '#fff' }}>{item.value}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Operations</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {po.status === 'draft' && (
                        <>
                           <button onClick={() => navigate(`/purchase-orders/${po._id}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                              <PencilSquareIcon style={{ width: '16px' }} /> Edit Draft
                           </button>
                           <button onClick={() => handleSend(po)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                              <PaperAirplaneIcon style={{ width: '16px' }} /> Mark as Sent
                           </button>
                        </>
                     )}
                     {(po.status === 'sent' || po.status === 'partial') && (
                        <button onClick={() => setReceivePO(po)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                           <DocumentCheckIcon style={{ width: '16px' }} /> Receive Delivery
                        </button>
                     )}
                     {(po.status === 'draft' || po.status === 'sent') && (
                        <button onClick={() => handleCancel(po)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                           <NoSymbolIcon style={{ width: '16px' }} /> Cancel Order
                        </button>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )
  }

  return (
    <div style={{ background: 'linear-gradient(160deg,#0a0b14 0%,#080810 100%)', display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,rgba(99,102,241,0.22) 0%,rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardDocumentListIcon style={{ width: '18px', height: '18px', color: '#818cf8' }} />
            </div>
            <div>
               <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Purchase Orders</h1>
               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage restocks & vendor orders</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <StatCard label="Total Orders" value={allOrdersStats.length} icon={<ClipboardDocumentListIcon style={{ width: 16 }} />} accent="#818cf8" accentBg="rgba(99,102,241,0.15)" />
            <StatCard label="Drafts" value={draftCount} icon={<PencilSquareIcon style={{ width: 16 }} />} accent="#f472b6" accentBg="rgba(244,114,182,0.12)" />
            <StatCard label="Sent Quotes" value={sentCount} icon={<PaperAirplaneIcon style={{ width: 16 }} />} accent="#38bdf8" accentBg="rgba(56,189,248,0.12)" />
            <StatCard label="Deliveries" value={receivedCount} icon={<DocumentArrowUpIcon style={{ width: 16 }} />} accent="#4ade80" accentBg="rgba(34,197,94,0.12)" />
          </div>
        </div>

        {actionError && (
           <div style={{ margin: '16px 28px 0', padding: '12px 16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '10px', color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><XCircleIcon style={{ width: 16, height: 16 }} />{actionError}</div>
               <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
           </div>
        )}

        <div style={{ padding: '20px 28px 0', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {STATUS_TABS.map((tab) => (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '99px', transition: 'all 150ms', cursor: 'pointer', whiteSpace: 'nowrap',
                         background: activeTab === tab.value ? '#6366f1' : 'rgba(255,255,255,0.04)',
                         color: activeTab === tab.value ? '#fff' : 'rgba(255,255,255,0.6)',
                         border: activeTab === tab.value ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(255,255,255,0.32)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PO # or Supplier..."
              style={{ width: '100%', height: '36px', paddingLeft: '36px', paddingRight: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#fff', outline: 'none' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', padding: '14px 28px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.065)', borderRadius: '16px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                     <TH>PO Number</TH>
                     <TH>Supplier</TH>
                     <TH align="center">Status</TH>
                     <TH align="right">Amount</TH>
                     <TH align="center">Created</TH>
                     <TH></TH>
                  </tr>
               </thead>
            </table>
            <div style={{ overflowY: 'auto', flex: 1 }}>
               {query.isLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
               ) : filtered.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '12px' }}>
                     <ClipboardDocumentListIcon style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.22)' }} />
                     <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>No orders match criteria</p>
                  </div>
               ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <tbody>
                        {filtered.map((po, idx) => {
                           const isSel = selectedRow?._id === po._id
                           const isHov = hoveredRow === po._id
                           const bd = idx === filtered.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.042)'
                           const statColor = STATUS_COLORS[po.status]
                           
                           return (
                              <tr key={po._id} onClick={() => setSelectedRow(isSel ? null : po)} onMouseEnter={() => setHoveredRow(po._id)} onMouseLeave={() => setHoveredRow(null)}
                                 style={{ background: isSel ? 'rgba(99,102,241,0.07)' : isHov ? 'rgba(255,255,255,0.032)' : 'transparent', cursor: 'pointer', transition: 'background 110ms', borderLeft: isSel ? '2px solid rgba(99,102,241,0.60)' : '2px solid transparent' }}>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '20%' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: isSel ? '#818cf8' : 'rgba(255,255,255,0.88)', fontFamily: 'monospace' }}>{po.poNumber}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '25%' }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{supplierMap[po.supplierId] ?? '—'}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'center', width: '15%' }}>
                                    <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: statColor.bg, color: statColor.color, textTransform: 'capitalize' }}>
                                       {po.status}
                                    </span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right', width: '20%' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>₱{po.totalAmount.toFixed(2)}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'center', width: '15%' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{new Date(po.createdAt).toLocaleDateString()}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right', width: '5%' }}>
                                    <ChevronRightIcon style={{ width: '14px', height: '14px', color: isSel ? '#818cf8' : 'rgba(255,255,255,0.22)', transition: 'color 120ms', transform: isSel ? 'rotate(90deg)' : 'none' }} />
                                 </td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', flexShrink: 0, position: 'relative', zIndex: 1 }} />

      <div style={{ flex: 1, minWidth: '260px', maxWidth: '320px', overflowY: 'auto', position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.15)' }}>
        <RightPanel />
      </div>

      {receivePO && <ReceivePOModal po={receivePO} onClose={() => setReceivePO(null)} />}
    </div>
  )
}
