// src/renderer/src/pages/roles/RolesPage.tsx
import { useState } from 'react'
import {
  PlusIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
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
              <ShieldCheckIcon style={{ width: '18px', height: '18px', color: '#6366f1' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>Roles</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.40)', marginTop: '2px', margin: 0 }}>
                Define access levels and capabilities for each staff role
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            New Role
          </button>
        </div>

        {/* Content area */}
        <div style={{ padding: '0 36px 36px', flex: 1 }}>

          {/* Error banner */}
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
              <ShieldCheckIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Role list */}
          {rolesQuery.isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.40)' }}>
              <div
                className="animate-spin"
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.10)',
                  borderTopColor: '#4F46E5',
                  flexShrink: 0,
                }}
              />
              Loading roles…
            </div>
          ) : roles.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '64px 20px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShieldCheckIcon style={{ width: '22px', height: '22px', color: 'rgba(255,255,255,0.28)' }} />
              </div>
              <div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>No roles defined yet</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', marginTop: '4px' }}>
                  Create your first role to start assigning permissions
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-secondary flex items-center gap-2 px-4 py-2"
                style={{ marginTop: '4px' }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                Create First Role
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {roles.map((role, idx) => {
                const accent = ROLE_ACCENTS[idx % ROLE_ACCENTS.length]
                return (
                  <div
                    key={role._id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      borderLeft: `3px solid ${accent.border}`,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    {/* Card top: name + actions */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '20px 24px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: accent.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <ShieldCheckIcon style={{ width: '16px', height: '16px', color: accent.icon }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontWeight: 600, fontSize: '15px', lineHeight: 1.3, color: '#ffffff', margin: 0 }}>
                              {role.name}
                            </h3>
                            {role.requiresSupervisorOverride && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(180,83,9,0.08)',
                                border: '1px solid rgba(180,83,9,0.18)',
                                color: '#b45309',
                              }}>
                                <LockClosedIcon style={{ width: '10px', height: '10px' }} />
                                Supervisor override
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', marginTop: '2px', margin: '2px 0 0' }}>
                            Max discount: <span style={{ color: 'rgba(255,255,255,0.65)' }}>{role.maxDiscountPercent}%</span>
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          marginRight: '4px',
                          background: accent.bg,
                          color: accent.icon,
                          border: `1px solid ${accent.border}22`,
                        }}>
                          {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setEditRole(role)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.35)',
                            background: 'rgba(255,255,255,0.05)',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                          title="Edit role"
                        >
                          <PencilSquareIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.35)',
                            background: 'rgba(255,255,255,0.05)',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                          title="Delete role"
                        >
                          <TrashIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>

                    {/* Divider + permissions */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ padding: '12px 24px 16px' }}>
                        {role.permissions.length === 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
                            <ShieldCheckIcon style={{ width: '12px', height: '12px' }} />
                            No permissions assigned
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
