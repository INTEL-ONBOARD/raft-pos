import { useState, useMemo } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TruckIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { useSuppliers } from '../../hooks/useSuppliers'
import { SupplierFormModal } from './SupplierFormModal'
import type { ISupplier } from '@shared/types/supplier.types'

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
         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            {children}
         </span>
      </th>
   )
}

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modalSupplier, setModalSupplier] = useState<ISupplier | null | undefined>(undefined)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<ISupplier | null>(null)

  const { query, deactivate } = useSuppliers({ includeInactive: showInactive })
  const suppliers = query.data?.data ?? []

  const activeCount = suppliers.filter(s => s.isActive).length
  const inactiveCount = suppliers.filter(s => !s.isActive).length

  const filtered = useMemo(() => {
     return suppliers.filter(s => 
       s.name.toLowerCase().includes(search.toLowerCase()) ||
       s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
       s.phone.includes(search)
     )
  }, [suppliers, search])

  async function handleDeactivate(supplier: ISupplier) {
    if (!confirm(`Deactivate "${supplier.name}"?`)) return
    try {
      await deactivate.mutateAsync(supplier._id)
      if (selectedRow?._id === supplier._id) setSelectedRow(null)
    } catch (err: any) {
      alert(err.message ?? 'Failed to deactivate supplier')
    }
  }

  const liveSelected = selectedRow ? (suppliers.find(r => r._id === selectedRow._id) ?? selectedRow) : null

  function RightPanel() {
      if (!liveSelected) {
         return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ padding: '20px 20px 0' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Network Overview</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>Select a supplier for details</p>
               </div>
               <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>Quick Actions</p>
                  <button onClick={() => setModalSupplier(null)} style={{ padding: '12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', color: '#818cf8', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'background 150ms', width: '100%' }}>
                     <PlusIcon style={{ width: '16px' }} /> Register New Supplier
                  </button>
               </div>
            </div>
         )
      }

      const s = liveSelected
      return (
         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
               <button onClick={() => setSelectedRow(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ← Network
               </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
               <div style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '14px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                     <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BuildingOfficeIcon style={{ width: '20px', height: '20px', color: '#818cf8' }} />
                     </div>
                     <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{s._id.slice(-8).toUpperCase()}</p>
                     </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                     {s.isActive ? (
                        <span style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(34,197,94,0.2)' }}>Active Supplier</span>
                     ) : (
                        <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)' }}>Inactive</span>
                     )}
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Contact Details</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {[
                        { label: 'Contact Person', value: s.contactPerson || '—', icon: <BuildingOfficeIcon style={{ width: 14 }} /> },
                        { label: 'Phone', value: s.phone || '—', icon: <PhoneIcon style={{ width: 14 }} /> },
                        { label: 'Email', value: s.email || '—', icon: <EnvelopeIcon style={{ width: 14 }} /> },
                        { label: 'Address', value: s.address || '—', icon: <TruckIcon style={{ width: 14 }} /> },
                        { label: 'Notes', value: s.notes || '—', icon: <DocumentTextIcon style={{ width: 14 }} /> }
                     ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px' }}>
                           <div style={{ color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{item.icon}</div>
                           <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 2px' }}>{item.label}</p>
                              <p style={{ fontSize: '13px', color: '#fff', margin: 0, whiteSpace: 'pre-wrap' }}>{item.value}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Operations</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <button onClick={() => setModalSupplier(s)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                        <PencilSquareIcon style={{ width: '16px' }} /> Edit Details
                     </button>
                     {s.isActive && (
                        <button onClick={() => handleDeactivate(s)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                           <NoSymbolIcon style={{ width: '16px' }} /> Deactivate Supplier
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
              <TruckIcon style={{ width: '18px', height: '18px', color: '#818cf8' }} />
            </div>
            <div>
               <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Suppliers</h1>
               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Vendor Management Network</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <StatCard label="Total Suppliers" value={suppliers.length} icon={<TruckIcon style={{ width: 16 }} />} accent="#818cf8" accentBg="rgba(99,102,241,0.15)" />
            <StatCard label="Active Partners" value={activeCount} icon={<CheckCircleIcon style={{ width: 16 }} />} accent="#4ade80" accentBg="rgba(34,197,94,0.12)" />
            <StatCard label="Inactive" value={inactiveCount} icon={<XCircleIcon style={{ width: 16 }} />} accent="#f87171" accentBg="rgba(239,68,68,0.15)" />
          </div>
        </div>

        <div style={{ padding: '20px 28px 0', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(255,255,255,0.32)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, contact, phone..."
              style={{ width: '100%', height: '36px', paddingLeft: '36px', paddingRight: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#fff', outline: 'none' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', background: showInactive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', border: showInactive ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)', padding: '0 14px', height: '36px', borderRadius: '9px', transition: 'all 150ms' }}>
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" /> Show inactive
          </label>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', padding: '14px 28px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.065)', borderRadius: '16px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                     <TH>Name</TH>
                     <TH>Contact Person</TH>
                     <TH>Phone</TH>
                     <TH>Email</TH>
                     <TH align="center">Status</TH>
                     <TH></TH>
                  </tr>
               </thead>
            </table>
            <div style={{ overflowY: 'auto', flex: 1 }}>
               {query.isLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
               ) : filtered.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '12px' }}>
                     <TruckIcon style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.22)' }} />
                     <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>No suppliers found</p>
                  </div>
               ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <tbody>
                        {filtered.map((s, idx) => {
                           const isSel = selectedRow?._id === s._id
                           const isHov = hoveredRow === s._id
                           const bd = idx === filtered.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.042)'
                           return (
                              <tr key={s._id} onClick={() => setSelectedRow(isSel ? null : s)} onMouseEnter={() => setHoveredRow(s._id)} onMouseLeave={() => setHoveredRow(null)}
                                 style={{ background: isSel ? 'rgba(99,102,241,0.07)' : isHov ? 'rgba(255,255,255,0.032)' : 'transparent', cursor: 'pointer', transition: 'background 110ms', borderLeft: isSel ? '2px solid rgba(99,102,241,0.60)' : '2px solid transparent' }}>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '20%' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: isSel ? '#818cf8' : 'rgba(255,255,255,0.88)' }}>{s.name}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '20%' }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{s.contactPerson || '—'}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '20%' }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{s.phone || '—'}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '20%' }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{s.email || '—'}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'center', width: '15%' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: s.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: s.isActive ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                                       <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                                       {s.isActive ? 'Active' : 'Inactive'}
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
          </div>
        </div>
      </div>

      <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', flexShrink: 0, position: 'relative', zIndex: 1 }} />

      <div style={{ flex: 1, minWidth: '260px', maxWidth: '320px', overflowY: 'auto', position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.15)' }}>
        <RightPanel />
      </div>

      {modalSupplier !== undefined && (
        <SupplierFormModal supplier={modalSupplier} onClose={() => setModalSupplier(undefined)} />
      )}
    </div>
  )
}
