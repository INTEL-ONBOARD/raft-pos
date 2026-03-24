// src/renderer/src/pages/users/UsersPage.tsx
import { useState } from 'react'
import {
  PlusIcon,
  ArrowRightOnRectangleIcon,
  BoltIcon,
  PencilSquareIcon,
  UserMinusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useUsers, useUserActivity } from '../../hooks/useUsers'
import { useRoles } from '../../hooks/useRoles'
import { useBranches } from '../../hooks/useBranches'
import { UserFormModal } from './UserFormModal'
import { UserActivityModal } from './UserActivityModal'
import type { IPublicUser } from '@shared/types/user.types'

const AVATAR_COLORS = [
  { bg: 'rgba(79,70,229,0.12)',  color: '#4338CA' },    // indigo-700
  { bg: 'rgba(22,163,74,0.12)',  color: '#15803d' },    // green-700
  { bg: 'rgba(217,119,6,0.12)',  color: '#b45309' },    // amber-700
  { bg: 'rgba(220,38,38,0.12)',  color: '#dc2626' },    // red-600
  { bg: 'rgba(29,78,216,0.12)',  color: '#1d4ed8' },    // blue-700
  { bg: 'rgba(124,58,237,0.12)', color: '#7c3aed' },    // purple-700
  { bg: 'rgba(13,148,136,0.12)', color: '#0d9488' },    // teal-600
  { bg: 'rgba(194,65,12,0.12)',  color: '#c2410c' },    // orange-700
]

function getAvatarColor(name: string) {
  const n = name || '?'
  const code = n.charCodeAt(0) + (n.charCodeAt(1) || 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

export default function UsersPage() {
  const { usersQuery, createMutation, updateMutation, deactivateMutation, forceLogoutMutation } = useUsers()
  const { rolesQuery } = useRoles()
  const { branchesQuery } = useBranches()
  const [editUser, setEditUser] = useState<IPublicUser | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [activityUserId, setActivityUserId] = useState<string | null>(null)
  const [activityUserName, setActivityUserName] = useState('')
  const [error, setError] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const activityQuery = useUserActivity(activityUserId)
  const roles = rolesQuery.data ?? []
  const branches = branchesQuery.data ?? []
  const users = usersQuery.data ?? []

  function roleNameFor(roleId: string) {
    return roles.find(r => r._id === roleId)?.name ?? roleId
  }

  async function handleCreate(data: any) {
    try { await createMutation.mutateAsync(data); setShowCreate(false) }
    catch (err: any) { setError(err.message) }
  }

  async function handleUpdate(data: any) {
    if (!editUser) return
    try { await updateMutation.mutateAsync({ id: editUser._id, input: data }); setEditUser(null) }
    catch (err: any) { setError(err.message) }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this user? They will not be able to log in.')) return
    try { await deactivateMutation.mutateAsync(id) }
    catch (err: any) { setError(err.message) }
  }

  async function handleForceLogout(id: string) {
    if (!confirm('Force-logout this user? Their active session will be revoked immediately.')) return
    try { await forceLogoutMutation.mutateAsync(id) }
    catch (err: any) { setError(err.message) }
  }

  const activeCount = users.filter(u => u.isActive).length

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: '#080810',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: 'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Page header */}
        <div style={{
          padding: '28px 36px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(99,102,241,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <UsersIcon style={{ width: '18px', height: '18px', color: '#6366f1' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Users</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.40)', marginTop: '2px', margin: 0 }}>
                {usersQuery.isLoading ? 'Loading…' : (
                  <span>
                    {users.length} {users.length === 1 ? 'user' : 'users'}
                    {users.length > 0 && (
                      <span style={{ margin: '0 6px', color: 'rgba(255,255,255,0.20)' }}>·</span>
                    )}
                    {users.length > 0 && (
                      <span style={{ color: '#16a34a' }}>{activeCount} active</span>
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2">
            <PlusIcon style={{ width: '16px', height: '16px' }} /> Add User
          </button>
        </div>

        {/* Content area */}
        <div style={{ padding: '0 36px 36px', flex: 1 }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px',
              fontSize: '13px',
              borderRadius: '12px',
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.15)',
              color: '#dc2626',
              marginBottom: '16px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Table container */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            {usersQuery.isError ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: '12px' }}>
                <p style={{ fontSize: '14px', color: '#f87171', margin: 0 }}>
                  {(usersQuery.error as Error)?.message ?? 'Failed to load users'}
                </p>
                <button
                  onClick={() => usersQuery.refetch()}
                  style={{ fontSize: '13px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Try again
                </button>
              </div>
            ) : usersQuery.isLoading ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['User', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h, i) => (
                      <th key={h} style={{
                        background: 'rgba(255,255,255,0.02)',
                        color: 'rgba(255,255,255,0.28)',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '10px 16px',
                        textAlign: i === 5 ? 'right' : 'left',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} style={{ height: '64px' }}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
                          <div className="animate-pulse" style={{
                            height: '14px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.06)',
                            width: j === 0 ? '130px' : j === 1 ? '160px' : '80px',
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : users.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <UsersIcon style={{ width: '22px', height: '22px', color: 'rgba(255,255,255,0.28)' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>No users yet</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', marginTop: '4px' }}>Add your first user to get started.</p>
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['User', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h, i) => (
                      <th key={h} style={{
                        background: 'rgba(255,255,255,0.02)',
                        color: 'rgba(255,255,255,0.28)',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '10px 16px',
                        textAlign: i === 5 ? 'right' : 'left',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => {
                    const avatar = getAvatarColor(u.name)
                    const isLast = idx === users.length - 1
                    return (
                      <tr
                        key={u._id}
                        onMouseEnter={() => setHoveredRow(u._id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          height: '64px',
                          background: hoveredRow === u._id ? 'rgba(255,255,255,0.03)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              flexShrink: 0,
                              fontSize: '13px',
                              fontWeight: 700,
                              letterSpacing: '0.01em',
                              userSelect: 'none',
                              background: avatar.bg,
                              color: avatar.color,
                            }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
                          {u.email}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: 'rgba(79,70,229,0.10)',
                            color: '#4F46E5',
                            border: '1px solid rgba(79,70,229,0.18)',
                          }}>
                            {roleNameFor(u.roleId)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
                          {u.isActive
                            ? <span className="badge-green">Active</span>
                            : <span className="badge-gray">Inactive</span>}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <button
                              onClick={() => { setActivityUserId(u._id); setActivityUserName(u.name) }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.35)',
                                background: 'transparent',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = 'rgba(37,99,235,0.08)' }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' }}
                              title="Activity log"
                              aria-label={`View activity log for ${u.name}`}
                            >
                              <BoltIcon style={{ width: '16px', height: '16px' }} />
                            </button>
                            <button
                              onClick={() => setEditUser(u)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.35)',
                                background: 'transparent',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.background = 'rgba(124,58,237,0.08)' }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' }}
                              title="Edit user"
                              aria-label={`Edit ${u.name}`}
                            >
                              <PencilSquareIcon style={{ width: '16px', height: '16px' }} />
                            </button>
                            {u.isActive && (
                              <button
                                onClick={() => handleForceLogout(u._id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'rgba(255,255,255,0.35)',
                                  background: 'transparent',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#c2410c'; e.currentTarget.style.background = 'rgba(194,65,12,0.08)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' }}
                                title="Force logout"
                                aria-label={`Force logout ${u.name}`}
                              >
                                <ArrowRightOnRectangleIcon style={{ width: '16px', height: '16px' }} />
                              </button>
                            )}
                            {u.isActive && (
                              <button
                                onClick={() => handleDeactivate(u._id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'rgba(255,255,255,0.35)',
                                  background: 'transparent',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' }}
                                title="Deactivate user"
                                aria-label={`Deactivate ${u.name}`}
                              >
                                <UserMinusIcon style={{ width: '16px', height: '16px' }} />
                              </button>
                            )}
                          </div>
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

      {(showCreate || editUser) && (
        <UserFormModal
          user={editUser}
          roles={roles}
          branches={branches}
          onConfirm={editUser ? handleUpdate : handleCreate}
          onClose={() => { setShowCreate(false); setEditUser(null) }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {activityUserId && (
        <UserActivityModal
          userName={activityUserName}
          activity={activityQuery.data ?? []}
          isLoading={activityQuery.isLoading}
          onClose={() => setActivityUserId(null)}
        />
      )}
    </div>
  )
}
