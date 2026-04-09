import { useState } from 'react'
import {
  CreditCardIcon,
  BanknotesIcon,
  LockClosedIcon,
  LockOpenIcon,
  PrinterIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useCashDrawer } from '../../hooks/useCashDrawer'
import { useAuthStore } from '../../stores/auth.store'
import type { ICashDrawer } from '@shared/types/cash-drawer.types'

const PAY_OUT_CATEGORIES = [
  { value: 'supplies', label: 'Supplies' },
  { value: 'cod_delivery', label: 'COD Delivery' },
  { value: 'petty_cash', label: 'Petty Cash' },
  { value: 'other', label: 'Other' }
] as const

function fmt(n?: number | null) {
  if (typeof n !== 'number' || isNaN(n)) return '0.00'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

function PayOutModal({ drawerId, onClose, onSubmit, isLoading }: { drawerId: string; onClose: () => void; onSubmit: (data: any) => void; isLoading: boolean }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState<string>('petty_cash')
  const [recipient, setRecipient] = useState('')
  const [err, setErr] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return setErr('Enter a valid amount')
    if (!reason.trim()) return setErr('Reason is required')
    if (!recipient.trim()) return setErr('Recipient is required')
    setErr('')
    onSubmit({ drawerId, amount: amt, reason: reason.trim(), category, recipient: recipient.trim() })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '380px' }}>
         <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Record Pay-Out</h2>
         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
               <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Amount (₱)</label>
               <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="dark-input w-full" autoFocus />
            </div>
            <div>
               <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Category</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="dark-input w-full">
                  {PAY_OUT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
               </select>
            </div>
            <div>
               <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Recipient</label>
               <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="dark-input w-full" />
            </div>
            <div>
               <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Reason</label>
               <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="dark-input w-full" />
            </div>
            {err && <p style={{ fontSize: '12px', color: '#dc2626', margin: 0 }}>{err}</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
               <button type="button" onClick={onClose} className="btn-secondary flex-1" style={{ borderRadius: '10px' }}>Cancel</button>
               <button type="submit" disabled={isLoading} className="btn-primary flex-1" style={{ borderRadius: '10px' }}>{isLoading ? 'Saving...' : 'Record Pay-Out'}</button>
            </div>
         </form>
      </div>
    </div>
  )
}

export default function CashDrawerPage() {
  const { role } = useAuthStore()
  const { drawersQuery, openDrawerQuery, openMutation, closeMutation, payOutMutation } = useCashDrawer()

  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<ICashDrawer | null>(null)
  const [showPayout, setShowPayout] = useState(false)

  const [openAmount, setOpenAmount] = useState('')
  const [closeAmount, setCloseAmount] = useState('')
  const [panelError, setPanelError] = useState('')

  const activeDrawer = openDrawerQuery.data
  const history = drawersQuery.data?.data ?? []

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault()
    const cash = parseFloat(openAmount)
    if (isNaN(cash) || cash < 0) { setPanelError('Enter a valid amount'); return }
    setPanelError('')
    try { await openMutation.mutateAsync({ openingCash: cash }); setOpenAmount('') }
    catch (err: any) { setPanelError(err.message ?? 'Failed to open') }
  }

  async function handleClose(e: React.FormEvent) {
    e.preventDefault()
    if (!activeDrawer) return
    const cash = parseFloat(closeAmount)
    if (isNaN(cash) || cash < 0) { setPanelError('Enter a valid closing amount'); return }
    setPanelError('')
    try { await closeMutation.mutateAsync({ closingCash: cash }); setCloseAmount('') }
    catch (err: any) { setPanelError(err.message ?? 'Failed to close') }
  }

  async function handlePayout(data: any) {
    try { await payOutMutation.mutateAsync(data); setShowPayout(false) }
    catch (err: any) { alert(err.message) }
  }

  function printZReport(d: ICashDrawer) {
    // integration hook for printing ZReport goes here
    alert(`Generating Z-Report for drawer opened at ${new Date(d.openedAt).toLocaleString()}...`)
  }

  const liveSelected = selectedRow ? (history.find(r => r._id === selectedRow._id) ?? selectedRow) : (activeDrawer ?? null)

  function RightPanel() {
      if (!liveSelected) {
         // No drawer active, no drawer selected -> Show Open Drawer Form
         return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
               <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <LockOpenIcon style={{ width: 16 }} /> Open New Shift
                  </h3>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Declare starting float to begin</p>
               </div>
               <form onSubmit={handleOpen} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                     <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '8px' }}>Opening Float (₱)</label>
                     <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: 600 }}>₱</span>
                        <input type="number" min="0" step="0.01" value={openAmount} onChange={e => setOpenAmount(e.target.value)} placeholder="0.00" autoFocus
                           style={{ width: '100%', padding: '10px 10px 10px 32px', fontSize: '16px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none' }} />
                     </div>
                  </div>
                  {panelError && <p style={{ fontSize: '12px', color: '#f87171', margin: 0 }}>{panelError}</p>}
                  <button type="submit" disabled={openMutation.isPending} style={{ width: '100%', padding: '12px', background: '#16a34a', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: openMutation.isPending ? 'not-allowed' : 'pointer', opacity: openMutation.isPending ? 0.7 : 1 }}>
                     {openMutation.isPending ? 'Opening...' : 'Open Drawer'}
                  </button>
               </form>
            </div>
         )
      }

      const d = liveSelected
      const isCurrentActive = activeDrawer && activeDrawer._id === d._id
      const variance = d.variance ?? 0

      return (
         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {!isCurrentActive && (
               <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <button onClick={() => setSelectedRow(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     ← History
                  </button>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>Past Shift Record</span>
               </div>
            )}
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
               <div style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '14px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                     <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Shift Details</p>
                     <span style={{ padding: '3px 10px', background: d.status === 'open' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: d.status === 'open' ? '#4ade80' : 'rgba(255,255,255,0.4)', borderRadius: '6px', fontSize: '10px', fontWeight: 700, border: d.status === 'open' ? `1px solid rgba(34,197,94,0.2)` : '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>
                        {d.status}
                     </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Opened</span><span style={{ fontSize: '12px', color: '#fff' }}>{new Date(d.openedAt).toLocaleString()}</span></div>
                     {d.closedAt && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Closed</span><span style={{ fontSize: '12px', color: '#fff' }}>{new Date(d.closedAt).toLocaleString()}</span></div>}
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Cashier</span><span style={{ fontSize: '12px', color: '#fff' }}>{d.cashierName}</span></div>
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Ledger</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Opening Float</span><span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>₱{fmt(d.openingCash)}</span></div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Total Sales</span><span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>₱{fmt(d.totalSales)}</span></div>
                     {d.payouts && d.payouts.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Pay-Outs</span><span style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>-₱{fmt(d.payouts.reduce((a,p) => a + p.amount, 0))}</span></div>}
                     <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{d.status === 'open' ? 'Expected Cash' : 'Closing Cash'}</span>
                        <span style={{ fontSize: '14px', color: '#fff', fontWeight: 700 }}>₱{fmt(d.status === 'open' ? (d.openingCash + d.totalSales - (d.payouts?.reduce((a,p) => a + p.amount, 0) || 0)) : (d.closingCash ?? 0))}</span>
                     </div>
                     {d.status === 'closed' && d.expectedCash !== null && d.closingCash !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Variance</span><span style={{ fontSize: '12px', fontWeight: 700, color: variance === 0 ? '#10b981' : '#f87171' }}>{variance > 0 ? '+' : ''}₱{fmt(variance)}</span></div>
                     )}
                  </div>
               </div>

               {isCurrentActive ? (
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                     <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>End Shift</p>
                     <form onSubmit={handleClose} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                           <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Actual Cash Count (₱)</label>
                           <input type="number" min="0" step="0.01" value={closeAmount} onChange={e => setCloseAmount(e.target.value)} placeholder="0.00"
                              style={{ width: '100%', padding: '10px 10px', fontSize: '14px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                        </div>
                        {panelError && <p style={{ fontSize: '12px', color: '#f87171', margin: 0 }}>{panelError}</p>}
                        <button type="submit" disabled={closeMutation.isPending} style={{ width: '100%', padding: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: closeMutation.isPending ? 'not-allowed' : 'pointer' }}>
                           <LockClosedIcon style={{ width: 14 }} /> Close Shift & Run Z-Report
                        </button>
                     </form>

                     <button onClick={() => setShowPayout(true)} style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontWeight: 500, fontSize: '12px', cursor: 'pointer' }}>
                        Record Pay-Out
                     </button>
                  </div>
               ) : (
                  <button onClick={() => printZReport(d)} style={{ marginTop: 'auto', padding: '12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', color: '#818cf8', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                     <PrinterIcon style={{ width: '16px' }} /> Print Z-Report
                  </button>
               )}
            </div>
         </div>
      )
  }

  return (
    <div style={{ background: 'linear-gradient(160deg,#0a0b14 0%,#080810 100%)', display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,rgba(22,163,74,0.15) 0%,rgba(22,163,74,0.05) 100%)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BanknotesIcon style={{ width: '18px', height: '18px', color: '#4ade80' }} />
            </div>
            <div>
               <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Cash Drawer</h1>
               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage shift float, payouts, and Z-reports</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <StatCard label="Total Shifts" value={history.length} icon={<LockClosedIcon style={{ width: 16 }} />} accent="#818cf8" accentBg="rgba(99,102,241,0.15)" />
            <StatCard label="Current State" value={activeDrawer ? 'OPEN' : 'CLOSED'} icon={<CheckCircleIcon style={{ width: 16 }} />} accent={activeDrawer ? '#4ade80' : '#9ca3af'} accentBg={activeDrawer ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)'} highlight={!!activeDrawer} />
            <StatCard label="Today's Sales" value={`₱${fmt(history.filter(d => new Date(d.openedAt).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.totalSales, 0))}`} icon={<BanknotesIcon style={{ width: 16 }} />} accent="#38bdf8" accentBg="rgba(56,189,248,0.12)" />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', padding: '20px 28px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.065)', borderRadius: '16px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                     <TH>Opened At</TH>
                     <TH>Closed At</TH>
                     <TH align="right">Opening</TH>
                     <TH align="right">Sales</TH>
                     <TH align="right">Closing</TH>
                     <TH align="right">Variance</TH>
                     <TH align="center">Status</TH>
                     <TH></TH>
                  </tr>
               </thead>
            </table>
            <div style={{ overflowY: 'auto', flex: 1 }}>
               {drawersQuery.isLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading history...</div>
               ) : history.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '12px' }}>
                     <LockClosedIcon style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.22)' }} />
                     <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>No shift history found</p>
                  </div>
               ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <tbody>
                        {history.map((d, idx) => {
                           const isSel = selectedRow?._id === d._id || (activeDrawer && activeDrawer._id === d._id && !selectedRow)
                           const isHov = hoveredRow === d._id
                           const bd = idx === history.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.042)'
                           const variance = d.variance ?? null
                           
                           return (
                              <tr key={d._id} onClick={() => setSelectedRow(d)} onMouseEnter={() => setHoveredRow(d._id)} onMouseLeave={() => setHoveredRow(null)}
                                 style={{ background: isSel ? 'rgba(99,102,241,0.07)' : isHov ? 'rgba(255,255,255,0.032)' : 'transparent', cursor: 'pointer', transition: 'background 110ms', borderLeft: isSel ? '2px solid rgba(99,102,241,0.60)' : '2px solid transparent' }}>
                                 <td style={{ padding: '13px 14px', borderBottom: bd }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{new Date(d.openedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{d.closedAt ? new Date(d.closedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>₱{fmt(d.openingCash)}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>₱{fmt(d.totalSales)}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{d.closingCash !== null ? `₱${fmt(d.closingCash)}` : '—'}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right' }}>
                                    {variance === null ? <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span> : (
                                       <span style={{ fontSize: '12px', fontWeight: 600, color: variance < 0 ? '#dc2626' : variance > 0 ? '#fbbf24' : '#16a34a' }}>
                                          {variance < 0 ? '▼ ' : variance > 0 ? '▲ ' : ''}₱{fmt(Math.abs(variance))}
                                       </span>
                                    )}
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'center' }}>
                                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', background: d.status === 'open' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: d.status === 'open' ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                                       {d.status}
                                    </span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right' }}>
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

      {showPayout && activeDrawer && (
        <PayOutModal
          drawerId={activeDrawer._id}
          onClose={() => setShowPayout(false)}
          onSubmit={handlePayout}
          isLoading={payOutMutation.isPending}
        />
      )}
    </div>
  )
}
