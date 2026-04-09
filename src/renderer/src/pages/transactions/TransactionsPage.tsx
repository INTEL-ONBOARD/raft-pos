import { useState, useMemo } from 'react'
import {
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  PrinterIcon,
  ReceiptRefundIcon,
  NoSymbolIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { useTransactions, usePOS } from '../../hooks/usePOS'
import { useAuthStore } from '../../stores/auth.store'
import { VoidModal } from './VoidModal'
import { RefundModal } from './RefundModal'
import type { ITransaction } from '@shared/types/transaction.types'

type FilterStatus = '' | 'completed' | 'voided' | 'refunded' | 'partially_refunded'

function fmt(n?: number | null) {
  if (typeof n !== 'number' || isNaN(n)) return '0.00'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  completed: { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' },
  voided: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
  refunded: { bg: 'rgba(250,204,21,0.1)', color: '#facc15', border: 'rgba(250,204,21,0.2)' },
  partially_refunded: { bg: 'rgba(250,204,21,0.1)', color: '#facc15', border: 'rgba(250,204,21,0.2)' }
}

const STATUS_TABS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Voided', value: 'voided' },
  { label: 'Refunds', value: 'refunded' }
]

function TH({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
   return (
      <th style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.28)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 14px', textAlign: align, borderBottom: '1px solid rgba(255,255,255,0.055)', whiteSpace: 'nowrap' }}>
         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
            {children}
         </span>
      </th>
   )
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
  const [selectedRow, setSelectedRow] = useState<ITransaction | null>(null)
  
  const LIMIT = 50

  const { data, isLoading, isError } = useTransactions({ status: statusFilter || undefined, from: dateFrom || undefined, to: dateTo || undefined, page, limit: LIMIT })
  
  // High-level stats lookup (estimated for dashboard based on returned array)
  const statsOverview = useTransactions({ limit: 100 }).data?.data ?? []
  const totalValue = statsOverview.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.totalAmount, 0)
  const voidCount = statsOverview.filter(t => t.status === 'voided').length
  const refundCount = statsOverview.filter(t => t.status === 'refunded' || t.status === 'partially_refunded').length

  const { voidMutation, refundMutation } = usePOS()

  const [voidTarget, setVoidTarget] = useState<ITransaction | null>(null)
  const [refundTarget, setRefundTarget] = useState<ITransaction | null>(null)
  const [actionError, setActionError] = useState('')

  const transactions = useMemo(() => {
     return (data?.data ?? []).filter((t) => !search || t.receiptNo.toLowerCase().includes(search.toLowerCase()))
  }, [data, search])

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  async function handleVoid(reason: string) {
    if (!voidTarget) return
    setActionError('')
    try {
      await voidMutation.mutateAsync({ transactionId: voidTarget._id, reason })
      setVoidTarget(null)
      setSelectedRow(null)
    } catch (err: any) { setActionError(err.message ?? 'Failed to void transaction') }
  }

  async function handleRefund(reason: string, refundedItems: Array<{ productId: string; quantity: number }>) {
    if (!refundTarget) return
    setActionError('')
    try {
      await refundMutation.mutateAsync({ transactionId: refundTarget._id, reason, refundedItems })
      setRefundTarget(null)
      setSelectedRow(null)
    } catch (err: any) { setActionError(err.message ?? 'Failed to refund transaction') }
  }

  const liveSelected = selectedRow ? (transactions.find(r => r._id === selectedRow._id) ?? selectedRow) : null

  function RightPanel() {
      if (!liveSelected) {
         return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ padding: '20px 20px 0' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Transaction Ledger</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>Select a receipt to view details & act</p>
               </div>
            </div>
         )
      }

      const t = liveSelected
      const statCol = STATUS_COLORS[t.status] || STATUS_COLORS.completed

      return (
         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
               <button onClick={() => setSelectedRow(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ← History
               </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
               <div style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '14px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                     <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'monospace' }}>{t.receiptNo}</p>
                     <span style={{ padding: '3px 10px', background: statCol.bg, color: statCol.color, borderRadius: '6px', fontSize: '10px', fontWeight: 600, border: `1px solid ${statCol.border}`, textTransform: 'capitalize' }}>
                        {t.status.replace('_', ' ')}
                     </span>
                  </div>
                  <p style={{ fontSize: '26px', fontWeight: 700, color: t.status === 'voided' ? '#f87171' : '#10b981', margin: '0 0 4px' }}>₱{fmt(t.totalAmount)}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{new Date(t.createdAt).toLocaleString()}</p>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Items</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     {t.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                           <div>
                              <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500, display: 'block' }}>{item.productName}</span>
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{item.quantity} x ₱{fmt(item.price)}</span>
                           </div>
                           <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>₱{fmt(item.subtotal)}</span>
                        </div>
                     ))}
                  </div>
               </div>
               
               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Summary</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Subtotal</span><span style={{ fontSize: '12px', color: '#fff' }}>₱{fmt(t.subtotal)}</span></div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Tax</span><span style={{ fontSize: '12px', color: '#fff' }}>₱{fmt(t.tax)}</span></div>
                     {t.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: '#f87171' }}>Discount</span><span style={{ fontSize: '12px', color: '#f87171' }}>- ₱{fmt(t.discountAmount)}</span></div>}
                     <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '4px' }}><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Net Amount</span><span style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>₱{fmt(t.totalAmount)}</span></div>
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Operations</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {canReprint && (
                        <button style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                           <PrinterIcon style={{ width: '16px' }} /> Reprint Receipt
                        </button>
                     )}
                     {canRefund && t.status === 'completed' && (
                        <button onClick={() => setRefundTarget(t)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.25)', color: '#facc15', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                           <ReceiptRefundIcon style={{ width: '16px' }} /> Process Refund
                        </button>
                     )}
                     {canVoid && t.status === 'completed' && (
                        <button onClick={() => setVoidTarget(t)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                           <NoSymbolIcon style={{ width: '16px' }} /> Void Transaction
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
              <ArrowsRightLeftIcon style={{ width: '18px', height: '18px', color: '#818cf8' }} />
            </div>
            <div>
               <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Transactions</h1>
               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Sales history, void, and refund management</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <StatCard label="Total Sales" value={`₱${fmt(totalValue)}`} icon={<CheckCircleIcon style={{ width: 16 }} />} accent="#4ade80" accentBg="rgba(34,197,94,0.12)" />
            <StatCard label="Txn Volume" value={statsOverview.length} icon={<DocumentTextIcon style={{ width: 16 }} />} accent="#818cf8" accentBg="rgba(99,102,241,0.15)" />
            <StatCard label="Voided" value={voidCount} icon={<NoSymbolIcon style={{ width: 16 }} />} accent="#f87171" accentBg="rgba(239,68,68,0.12)" />
            <StatCard label="Refunds" value={refundCount} icon={<ReceiptRefundIcon style={{ width: 16 }} />} accent="#facc15" accentBg="rgba(250,204,21,0.12)" />
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
              <button key={tab.label} onClick={() => { setStatusFilter(tab.value); setPage(1) }}
                style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '99px', transition: 'all 150ms', cursor: 'pointer', whiteSpace: 'nowrap',
                         background: statusFilter === tab.value ? '#6366f1' : 'rgba(255,255,255,0.04)',
                         color: statusFilter === tab.value ? '#fff' : 'rgba(255,255,255,0.6)',
                         border: statusFilter === tab.value ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
               <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(255,255,255,0.32)' }} />
               <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search receipt number…"
                 style={{ width: '100%', height: '36px', paddingLeft: '36px', paddingRight: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#fff', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
               <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} style={{ height: '36px', padding: '0 10px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#fff', outline: 'none' }} />
               <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} style={{ height: '36px', padding: '0 10px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#fff', outline: 'none' }} />
               {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>Clear</button>}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', padding: '14px 28px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.065)', borderRadius: '16px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                     <TH>Receipt No</TH>
                     <TH>Date Created</TH>
                     <TH align="right">Items</TH>
                     <TH align="right">Amount</TH>
                     <TH align="center">Method</TH>
                     <TH align="center">Status</TH>
                     <TH></TH>
                  </tr>
               </thead>
            </table>
            <div style={{ overflowY: 'auto', flex: 1 }}>
               {isLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
               ) : isError ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#f87171' }}>Failed to load transactions</div>
               ) : transactions.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '12px' }}>
                     <DocumentTextIcon style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.22)' }} />
                     <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>No transactions match criteria</p>
                  </div>
               ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <tbody>
                        {transactions.map((t, idx) => {
                           const isSel = selectedRow?._id === t._id
                           const isHov = hoveredRow === t._id
                           const bd = idx === transactions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.042)'
                           const statCol = STATUS_COLORS[t.status] || STATUS_COLORS.completed
                           
                           return (
                              <tr key={t._id} onClick={() => setSelectedRow(isSel ? null : t)} onMouseEnter={() => setHoveredRow(t._id)} onMouseLeave={() => setHoveredRow(null)}
                                 style={{ background: isSel ? 'rgba(99,102,241,0.07)' : isHov ? 'rgba(255,255,255,0.032)' : 'transparent', cursor: 'pointer', transition: 'background 110ms', borderLeft: isSel ? '2px solid rgba(99,102,241,0.60)' : '2px solid transparent' }}>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '20%' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: isSel ? '#818cf8' : 'rgba(255,255,255,0.88)', fontFamily: 'monospace' }}>{t.receiptNo}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '20%' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{new Date(t.createdAt).toLocaleString()}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right', width: '10%' }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{t.items.reduce((s, i) => s + i.quantity, 0)}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right', width: '20%' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: t.status === 'voided' ? 'rgba(255,255,255,0.4)' : '#10b981', textDecoration: t.status === 'voided' ? 'line-through' : 'none' }}>₱{fmt(t.totalAmount)}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'center', width: '15%' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{t.isSplit ? 'Split' : (t.payments[0]?.method ?? '—')}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'center', width: '10%' }}>
                                    <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: statCol.bg, color: statCol.color, textTransform: 'capitalize' }}>
                                       {t.status.replace('_', ' ')}
                                    </span>
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
            
            {/* Pagination inside table bottom */}
            {totalPages > 1 && (
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Page {page} of {totalPages}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                     <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', color: page <= 1 ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                     <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', color: page >= totalPages ? 'rgba(255,255,255,0.2)' : '#fff', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', flexShrink: 0, position: 'relative', zIndex: 1 }} />

      <div style={{ flex: 1, minWidth: '260px', maxWidth: '320px', overflowY: 'auto', position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.15)' }}>
        <RightPanel />
      </div>

      {voidTarget && <VoidModal transaction={voidTarget} onConfirm={handleVoid} onClose={() => setVoidTarget(null)} isLoading={voidMutation.isPending} />}
      {refundTarget && <RefundModal transaction={refundTarget} onConfirm={handleRefund} onClose={() => setRefundTarget(null)} isLoading={refundMutation.isPending} />}
    </div>
  )
}
