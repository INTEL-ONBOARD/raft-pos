// src/renderer/src/pages/users/UserFormModal.tsx
import { useState, useEffect } from 'react'
import { X, UserPlus, UserCog } from 'lucide-react'
import type { IPublicUser, CreateUserInput, UpdateUserInput } from '@shared/types/user.types'
import type { IPublicRole } from '@shared/types/role.types'

interface Props {
  user?: IPublicUser | null
  roles: IPublicRole[]
  onConfirm: (data: CreateUserInput | UpdateUserInput) => void
  onClose: () => void
  isLoading: boolean
}

export function UserFormModal({ user, roles, onConfirm, onClose, isLoading }: Props) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState(user?.roleId ?? '')
  const [branchId, setBranchId] = useState(user?.branchId ?? '')
  const [supervisorPin, setSupervisorPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setRoleId(user?.roleId ?? '')
    setBranchId(user?.branchId ?? '')
    setPassword('')
    setSupervisorPin('')
  }, [user])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (!email.trim()) return setError('Email is required')
    if (!user && (!password || password.length < 6)) return setError('Password must be at least 6 characters')
    if (!roleId) return setError('Role is required')
    if (!branchId.trim()) return setError('Branch ID is required')
    if (supervisorPin && !/^\d{4}$/.test(supervisorPin)) return setError('Supervisor PIN must be exactly 4 digits')

    const data: any = { name, email, roleId, branchId }
    if (password) data.password = password
    if (supervisorPin) data.supervisorPin = supervisorPin
    else if (user) data.supervisorPin = null
    onConfirm(data)
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              {user
                ? <UserCog className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                : <UserPlus className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              }
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user ? 'Edit User' : 'Create User'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-3">
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="dark-input mt-1" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="dark-input mt-1" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{user ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="dark-input mt-1" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Role *</label>
              <select value={roleId} onChange={e => setRoleId(e.target.value)} className="dark-select mt-1">
                <option value="">Select role…</option>
                {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Branch ID *</label>
              <input value={branchId} onChange={e => setBranchId(e.target.value)} placeholder="MongoDB ObjectId" className="dark-input mt-1" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Supervisor PIN (4 digits, optional)</label>
              <input type="password" inputMode="numeric" maxLength={4} value={supervisorPin} onChange={e => setSupervisorPin(e.target.value)} placeholder="Leave blank to clear" className="dark-input mt-1" />
            </div>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary px-5 py-2 disabled:opacity-50">
              {isLoading ? 'Saving…' : user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
