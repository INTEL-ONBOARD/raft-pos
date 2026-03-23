// src/renderer/src/pages/roles/RoleFormModal.tsx
import { useState, useEffect } from 'react'
import { X, Shield } from 'lucide-react'
import { ALL_PERMISSIONS } from '@shared/types/permissions'
import type { IPublicRole, CreateRoleInput } from '@shared/types/role.types'
import type { Permission } from '@shared/types/permissions'

interface Props {
  role?: IPublicRole | null
  onConfirm: (data: CreateRoleInput) => void
  onClose: () => void
  isLoading: boolean
}

export function RoleFormModal({ role, onConfirm, onClose, isLoading }: Props) {
  const [name, setName] = useState(role?.name ?? '')
  const [permissions, setPermissions] = useState<Permission[]>(role?.permissions ?? [])
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(role?.maxDiscountPercent ?? 0)
  const [requiresSupervisorOverride, setRequiresSupervisorOverride] = useState(role?.requiresSupervisorOverride ?? false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (role) {
      setName(role.name); setPermissions(role.permissions)
      setMaxDiscountPercent(role.maxDiscountPercent); setRequiresSupervisorOverride(role.requiresSupervisorOverride)
    }
  }, [role])

  function togglePermission(p: Permission) {
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Role name is required')
    onConfirm({ name, permissions, maxDiscountPercent, requiresSupervisorOverride })
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {role ? 'Edit Role' : 'Create Role'}
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-5 space-y-3 shrink-0">
            <div>
              <label htmlFor="role-name" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Role Name *</label>
              <input id="role-name" value={name} onChange={e => setName(e.target.value)} className="dark-input mt-1" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="role-max-discount" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Max Discount %</label>
                <input id="role-max-discount" type="number" min="0" max="100" inputMode="decimal" value={maxDiscountPercent} onChange={e => setMaxDiscountPercent(Number(e.target.value))} className="dark-input mt-1" />
              </div>
              <div className="flex items-end pb-2 gap-2">
                <input id="super-override" type="checkbox" checked={requiresSupervisorOverride} onChange={e => setRequiresSupervisorOverride(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="super-override" className="text-sm" style={{ color: 'var(--text-primary)' }}>Requires supervisor override</label>
              </div>
            </div>
          </div>

          {/* Permissions scrollable area */}
          <div className="flex-1 overflow-y-auto px-6 pb-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-sm font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Permissions</p>
            <div className="space-y-1">
              {ALL_PERMISSIONS.map(p => (
                <label key={p} className="flex items-center gap-2 p-2 rounded-xl cursor-pointer text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--border-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePermission(p)} className="w-4 h-4" />
                  <span>{p.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary px-5 py-2 disabled:opacity-50">
                {isLoading ? 'Saving…' : role ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}
