import { useState, useMemo } from 'react'
import {
  PlusIcon,
  ArrowRightOnRectangleIcon,
  BoltIcon,
  PencilSquareIcon,
  UserMinusIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useUsers, useUserActivity } from '../../hooks/useUsers'
import { useRoles } from '../../hooks/useRoles'
import { useBranches } from '../../hooks/useBranches'
import { UserFormModal } from './UserFormModal'
import { UserActivityModal } from './UserActivityModal'
import type { IPublicUser } from '@shared/types/user.types'

const AVATAR_COLORS = [
  { bg: 'rgba(79,70,229,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.2)' },
  { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' },
  { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
  { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
  { bg: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: 'rgba(56,189,248,0.2)' },
  { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.2)' },
  { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: 'rgba(45,212,191,0.2)' },
  { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(251,146,60,0.2)' }
]

function getAvatarColor(name: string) {
  const n = name || '?'
  const code = n.charCodeAt(0) + (n.charCodeAt(1) || 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
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
         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            {children}
         </span>
      </th>
   )
}

export default function UsersPage() {
  const { usersQuery, createMutation, updateMutation, deactivateMutation, forceLogoutMutation } = useUsers()
  const { rolesQuery } = useRoles()
  const { branchesQuery } = useBranches()
  
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<IPublicUser | null>(null)
  
  const [editUser, setEditUser] = useState<IPublicUser | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  
  const [activityUserId, setActivityUserId] = useState<string | null>(null)
  const [activityUserName, setActivityUserName] = useState('')
  const activityQuery = useUserActivity(activityUserId)
  
  const [error, setError] = useState('')

  const roles = rolesQuery.data ?? []
  const branches = branchesQuery.data ?? []
  const users = usersQuery.data ?? []

  const activeCount = users.filter(u => u.isActive).length
  const inactiveCount = users.filter(u => !u.isActive).length

  function roleNameFor(roleId: string) {
    return roles.find((r) => r._id === roleId)?.name ?? roleId
  }

  const filtered = useMemo(() => {
     return users.filter(u => {
        if (!showInactive && !u.isActive) return false
        if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
        return true
     })
  }, [users, search, showInactive])

  async function handleCreate(data: any) {
    try { await createMutation.mutateAsync(data); setShowCreate(false); setError('') }
    catch (err: any) { setError(err.message) }
  }

  async function handleUpdate(data: any) {
    if (!editUser) return
    try { await updateMutation.mutateAsync({ id: editUser._id, input: data }); setEditUser(null); setError('') }
    catch (err: any) { setError(err.message) }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this user? They will not be able to log in.')) return
    try { await deactivateMutation.mutateAsync(id); setError('') }
    catch (err: any) { setError(err.message) }
  }

  async function handleForceLogout(id: string) {
    if (!confirm('Force-logout this user? Their active session will be revoked immediately.')) return
    try { await forceLogoutMutation.mutateAsync(id); setError('') }
    catch (err: any) { setError(err.message) }
  }

  const liveSelected = selectedRow ? (users.find(r => r._id === selectedRow._id) ?? selectedRow) : null

  function RightPanel() {
      if (!liveSelected) {
         return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ padding: '20px 20px 0' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>System Users</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>Select a user to view or manage</p>
               </div>
               <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>Quick Actions</p>
                  <button onClick={() => { setShowCreate(true); setEditUser(null); setError('') }} style={{ padding: '12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', color: '#818cf8', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'background 150ms', width: '100%' }}>
                     <PlusIcon style={{ width: '16px' }} /> Register New User
                  </button>
               </div>
            </div>
         )
      }

      const u = liveSelected
      const avatar = getAvatarColor(u.name)

      return (
         <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
               <button onClick={() => setSelectedRow(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ← Directory
               </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
               <div style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: avatar.bg, border: `2px solid ${avatar.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: avatar.color, marginBottom: '16px' }}>
                     {u.name.charAt(0).toUpperCase()}
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>{u.name}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '4px 0 16px' }}>{u.email}</p>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                     <span style={{ padding: '4px 12px', background: 'rgba(79,70,229,0.1)', color: '#818cf8', borderRadius: '99px', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(79,70,229,0.2)' }}>
                        {roleNameFor(u.roleId)}
                     </span>
                     {u.isActive ? (
                        <span style={{ padding: '4px 12px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: '99px', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(34,197,94,0.2)' }}>Active</span>
                     ) : (
                        <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderRadius: '99px', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>Inactive</span>
                     )}
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Account Info</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {[
                        { label: 'User ID', value: u._id.slice(-8).toUpperCase() },
                        { label: 'Created At', value: new Date(u.createdAt).toLocaleDateString() },
                        { label: 'Last Login', value: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in' }
                     ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                           <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                           <span style={{ fontSize: '12px', color: '#fff', fontFamily: item.label === 'User ID' ? 'monospace' : 'inherit' }}>{item.value}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Security & Operations</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <button onClick={() => { setActivityUserId(u._id); setActivityUserName(u.name) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                        <BoltIcon style={{ width: '16px' }} /> View Activity Log
                     </button>
                     <button onClick={() => setEditUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                        <PencilSquareIcon style={{ width: '16px' }} /> Edit User Details
                     </button>
                     {u.isActive && (
                        <>
                           <button onClick={() => handleForceLogout(u._id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24', cursor: 'pointer', fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                              <ArrowRightOnRectangleIcon style={{ width: '16px' }} /> Force Logout Session
                           </button>
                           <button onClick={() => handleDeactivate(u._id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                              <UserMinusIcon style={{ width: '16px' }} /> Suspend Account
                           </button>
                        </>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1, borderRight: '1px solid rgba(255,255,255,0.04)' }}>

        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <StatCard label="Total Users" value={users.length} icon={<UsersIcon style={{ width: 16 }} />} accent="#818cf8" accentBg="rgba(99,102,241,0.15)" />
            <StatCard label="Active Accounts" value={activeCount} icon={<CheckCircleIcon style={{ width: 16 }} />} accent="#4ade80" accentBg="rgba(34,197,94,0.12)" />
            <StatCard label="Suspended" value={inactiveCount} icon={<XCircleIcon style={{ width: 16 }} />} accent="#f87171" accentBg="rgba(239,68,68,0.15)" />
            <StatCard label="Roles Defined" value={roles.length} icon={<ShieldCheckIcon style={{ width: 16 }} />} accent="#38bdf8" accentBg="rgba(56,189,248,0.12)" />
          </div>
        </div>

        {error && (
           <div style={{ margin: '16px 28px 0', padding: '12px 16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '10px', color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <XCircleIcon style={{ width: 16, height: 16 }} />
               {error}
           </div>
        )}

        <div style={{ padding: '20px 28px 0', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(255,255,255,0.32)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
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
                     <TH>User</TH>
                     <TH>Email</TH>
                     <TH>Role</TH>
                     <TH align="center">Status</TH>
                     <TH></TH>
                  </tr>
               </thead>
            </table>
            <div style={{ overflowY: 'auto', flex: 1 }}>
               {usersQuery.isLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
               ) : filtered.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '12px' }}>
                     <UsersIcon style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.22)' }} />
                     <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>No users found</p>
                  </div>
               ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <tbody>
                        {filtered.map((u, idx) => {
                           const isSel = selectedRow?._id === u._id
                           const isHov = hoveredRow === u._id
                           const bd = idx === filtered.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.042)'
                           const avatar = getAvatarColor(u.name)
                           return (
                              <tr key={u._id} onClick={() => setSelectedRow(isSel ? null : u)} onMouseEnter={() => setHoveredRow(u._id)} onMouseLeave={() => setHoveredRow(null)}
                                 style={{ background: isSel ? 'rgba(99,102,241,0.07)' : isHov ? 'rgba(255,255,255,0.032)' : 'transparent', cursor: 'pointer', transition: 'background 110ms', borderLeft: isSel ? '2px solid rgba(99,102,241,0.60)' : '2px solid transparent' }}>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '30%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                       <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: avatar.bg, border: `1px solid ${avatar.border}`, color: avatar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                                          {u.name.charAt(0).toUpperCase()}
                                       </div>
                                       <span style={{ fontSize: '13px', fontWeight: 600, color: isSel ? '#818cf8' : 'rgba(255,255,255,0.88)' }}>{u.name}</span>
                                    </div>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '25%' }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{u.email}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, width: '20%' }}>
                                    <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>{roleNameFor(u.roleId)}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'center', width: '15%' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: u.isActive ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                                       <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                                       {u.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right', width: '10%' }}>
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

      {(showCreate || editUser) && (
        <UserFormModal
          user={editUser} roles={roles} branches={branches}
          onConfirm={editUser ? handleUpdate : handleCreate}
          onClose={() => { setShowCreate(false); setEditUser(null) }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {activityUserId && (
        <UserActivityModal
          userName={activityUserName} activity={activityQuery.data ?? []}
          isLoading={activityQuery.isLoading} onClose={() => setActivityUserId(null)}
        />
      )}
    </div>
  )
}
