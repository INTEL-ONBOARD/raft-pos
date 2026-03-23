// src/renderer/src/pages/users/UsersPage.tsx
import { useState } from 'react'
import { Plus, LogOut, Activity, Pencil, UserX, Users } from 'lucide-react'
import { useUsers, useUserActivity } from '../../hooks/useUsers'
import { useRoles } from '../../hooks/useRoles'
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
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

export default function UsersPage() {
  const { usersQuery, createMutation, updateMutation, deactivateMutation, forceLogoutMutation } = useUsers()
  const { rolesQuery } = useRoles()
  const [editUser, setEditUser] = useState<IPublicUser | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [activityUserId, setActivityUserId] = useState<string | null>(null)
  const [activityUserName, setActivityUserName] = useState('')
  const [error, setError] = useState('')

  const activityQuery = useUserActivity(activityUserId)
  const roles = rolesQuery.data ?? []
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
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Users</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {usersQuery.isLoading ? 'Loading…' : (
                <span>
                  {users.length} {users.length === 1 ? 'user' : 'users'}
                  {users.length > 0 && (
                    <span className="ml-2" style={{ color: 'var(--border-default)' }}>·</span>
                  )}
                  {users.length > 0 && (
                    <span className="ml-2" style={{ color: '#16a34a' }}>{activeCount} active</span>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 px-4 py-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="p-6 flex-1 space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-3.5 text-sm rounded-xl"
            style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626' }}>
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#dc2626' }} />
            {error}
          </div>
        )}

        <div className="content-card overflow-hidden">
          {usersQuery.isLoading ? (
            <table className="dark-table">
              <thead>
                <tr>
                  <th className="text-left">User</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Role</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Last Login</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ height: '64px' }}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}>
                        <div className="h-4 rounded animate-pulse" style={{ background: 'var(--border-subtle)', width: j === 0 ? '130px' : j === 1 ? '160px' : '80px' }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <Users className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No users yet</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Add your first user to get started.</p>
              </div>
            </div>
          ) : (
            <table className="dark-table">
              <thead>
                <tr>
                  <th className="text-left">User</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Role</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Last Login</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const avatar = getAvatarColor(u.name)
                  return (
                    <tr key={u._id} style={{ height: '64px' }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-sm font-bold select-none"
                            style={{ background: avatar.bg, color: avatar.color, letterSpacing: '0.01em' }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(79,70,229,0.10)', color: '#4F46E5', border: '1px solid rgba(79,70,229,0.18)' }}>
                          {roleNameFor(u.roleId)}
                        </span>
                      </td>
                      <td>
                        {u.isActive
                          ? <span className="badge-green">Active</span>
                          : <span className="badge-gray">Inactive</span>}
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}
                      </td>
                      <td className="row-actions">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setActivityUserId(u._id); setActivityUserName(u.name) }}
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                            style={{ color: 'var(--text-muted)', background: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = 'rgba(37,99,235,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                            title="Activity log" aria-label={`View activity log for ${u.name}`}>
                            <Activity className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditUser(u)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                            style={{ color: 'var(--text-muted)', background: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.background = 'rgba(124,58,237,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                            title="Edit user" aria-label={`Edit ${u.name}`}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u.isActive && (
                            <button
                              onClick={() => handleForceLogout(u._id)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                              style={{ color: 'var(--text-muted)', background: 'transparent' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#c2410c'; e.currentTarget.style.background = 'rgba(194,65,12,0.08)' }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                              title="Force logout" aria-label={`Force logout ${u.name}`}>
                              <LogOut className="w-4 h-4" />
                            </button>
                          )}
                          {u.isActive && (
                            <button
                              onClick={() => handleDeactivate(u._id)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                              style={{ color: 'var(--text-muted)', background: 'transparent' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)' }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                              title="Deactivate user" aria-label={`Deactivate ${u.name}`}>
                              <UserX className="w-4 h-4" />
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

        {(showCreate || editUser) && (
          <UserFormModal
            user={editUser}
            roles={roles}
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
    </div>
  )
}
