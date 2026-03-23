// src/renderer/src/pages/roles/RolesPage.tsx
import { useState } from 'react'
import { Plus, Pencil, Trash2, Shield, ShieldAlert, Lock } from 'lucide-react'
import { useRoles } from '../../hooks/useRoles'
import { RoleFormModal } from './RoleFormModal'
import type { IPublicRole } from '@shared/types/role.types'

const ROLE_ACCENTS = [
  { border: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: '#818cf8' },
  { border: '#059669', bg: 'rgba(5,150,105,0.12)', icon: '#34d399' },
  { border: '#ea580c', bg: 'rgba(234,88,12,0.12)', icon: '#fb923c' },
  { border: '#7c3aed', bg: 'rgba(124,58,237,0.12)', icon: '#a78bfa' },
  { border: '#0284c7', bg: 'rgba(2,132,199,0.12)', icon: '#38bdf8' },
  { border: '#db2777', bg: 'rgba(219,39,119,0.12)', icon: '#f472b6' },
]

export default function RolesPage() {
  const { rolesQuery, createMutation, updateMutation, deleteMutation } = useRoles()
  const [editRole, setEditRole] = useState<IPublicRole | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')

  const roles = rolesQuery.data ?? []

  async function handleCreate(data: any) {
    try { await createMutation.mutateAsync(data); setShowCreate(false) }
    catch (err: any) { setError(err.message) }
  }

  async function handleUpdate(data: any) {
    if (!editRole) return
    try { await updateMutation.mutateAsync({ id: editRole._id, input: data }); setEditRole(null) }
    catch (err: any) { setError(err.message) }
  }

  async function handleDelete(role: IPublicRole) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return
    try { await deleteMutation.mutateAsync(role._id) }
    catch (err: any) { setError(err.message) }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>

      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <Shield className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Roles</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Define access levels and capabilities for each staff role
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          New Role
        </button>
      </div>

      <div className="p-8 flex-1 space-y-4">

        {/* Error banner */}
        {error && (
          <div
            className="flex items-center gap-3 p-4 text-sm rounded-xl"
            style={{
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.15)',
              color: '#dc2626'
            }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Role list */}
        {rolesQuery.isLoading ? (
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            <div
              className="w-4 h-4 rounded-full animate-spin"
              style={{ border: '2px solid var(--border-default)', borderTopColor: '#4F46E5' }}
            />
            Loading roles…
          </div>
        ) : roles.length === 0 ? (
          <div
            className="content-card flex flex-col items-center justify-center gap-4 py-16 text-center"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}
            >
              <Shield className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No roles defined yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Create your first role to start assigning permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm mt-1"
            >
              <Plus className="w-4 h-4" />
              Create First Role
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {roles.map((role, idx) => {
              const accent = ROLE_ACCENTS[idx % ROLE_ACCENTS.length]
              return (
                <div
                  key={role._id}
                  className="content-card overflow-hidden"
                  style={{ borderLeft: `3px solid ${accent.border}` }}
                >
                  {/* Card top: name + actions */}
                  <div className="flex items-start justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: accent.bg }}
                      >
                        <Shield className="w-4 h-4" style={{ color: accent.icon }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {role.name}
                          </h3>
                          {role.requiresSupervisorOverride && (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(180,83,9,0.08)',
                                border: '1px solid rgba(180,83,9,0.18)',
                                color: '#b45309'
                              }}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              Supervisor override
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Max discount: <span style={{ color: 'var(--text-secondary)' }}>{role.maxDiscountPercent}%</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full mr-1"
                        style={{
                          background: accent.bg,
                          color: accent.icon,
                          border: `1px solid ${accent.border}22`
                        }}
                      >
                        {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => setEditRole(role)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--text-muted)', background: 'var(--border-subtle)' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = 'var(--text-primary)'
                          e.currentTarget.style.background = 'var(--border-default)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'var(--text-muted)'
                          e.currentTarget.style.background = 'var(--border-subtle)'
                        }}
                        title="Edit role"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(role)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--text-muted)', background: 'var(--border-subtle)' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#dc2626'
                          e.currentTarget.style.background = 'rgba(220,38,38,0.08)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'var(--text-muted)'
                          e.currentTarget.style.background = 'var(--border-subtle)'
                        }}
                        title="Delete role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Divider + permissions */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="px-6 py-3">
                      {role.permissions.length === 0 ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Shield className="w-3 h-3" />
                          No permissions assigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {role.permissions.map(p => (
                            <span key={p} className="badge-blue">
                              {p.replace('can_', '').replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {(showCreate || editRole) && (
        <RoleFormModal
          role={editRole}
          onConfirm={editRole ? handleUpdate : handleCreate}
          onClose={() => { setShowCreate(false); setEditRole(null) }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}
