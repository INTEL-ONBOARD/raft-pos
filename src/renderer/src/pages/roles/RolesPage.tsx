// src/renderer/src/pages/roles/RolesPage.tsx
import { useState } from 'react'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useRoles } from '../../hooks/useRoles'
import { useUsers } from '../../hooks/useUsers'
import { RoleFormModal } from './RoleFormModal'
import type { CreateRoleInput, IPublicRole } from '@shared/types/role.types'
import type { Permission } from '@shared/types/permissions'
import type { IPublicUser } from '@shared/types/user.types'

// ─── Permission matrix data ───────────────────────────────────────────────────
type PermissionMatrixRow = {
  key: Permission
  label: string
  desc: string
}

type PermissionMatrixGroup = {
  group: string
  color: string
  rows: PermissionMatrixRow[]
}

const MATRIX: PermissionMatrixGroup[] = [
  {
    group: 'Sales',
    color: '#34d399',
    rows: [
      { key: 'can_make_sale', label: 'Make Sale', desc: 'Process sales transactions at POS' },
      { key: 'can_apply_discount', label: 'Apply Discount', desc: 'Apply line-item discounts' },
      {
        key: 'can_apply_order_discount',
        label: 'Order Discount',
        desc: 'Apply order-level discounts'
      },
      {
        key: 'can_void_transaction',
        label: 'Void Transaction',
        desc: 'Void completed transactions'
      },
      { key: 'can_refund_transaction', label: 'Refund', desc: 'Process full or partial refunds' },
      { key: 'can_reprint_receipt', label: 'Reprint Receipt', desc: 'Reprint customer receipts' }
    ]
  },
  {
    group: 'Inventory',
    color: '#60a5fa',
    rows: [
      { key: 'can_manage_products', label: 'Products', desc: 'Create and edit products' },
      { key: 'can_manage_categories', label: 'Categories', desc: 'Manage product categories' },
      { key: 'can_manage_inventory', label: 'Inventory', desc: 'Adjust stock levels' },
      { key: 'can_manage_suppliers', label: 'Suppliers', desc: 'Manage supplier records' },
      {
        key: 'can_manage_purchase_orders',
        label: 'Purchase Orders',
        desc: 'Create and receive POs'
      }
    ]
  },
  {
    group: 'Transfers',
    color: '#a78bfa',
    rows: [
      {
        key: 'can_approve_stock_transfer',
        label: 'Approve Transfer',
        desc: 'Approve inter-branch stock transfers'
      },
      {
        key: 'can_receive_stock_transfer',
        label: 'Receive Transfer',
        desc: 'Receive incoming stock transfers'
      }
    ]
  },
  {
    group: 'Reports',
    color: '#fb923c',
    rows: [
      { key: 'can_view_reports', label: 'View Reports', desc: 'Access reporting dashboards' },
      { key: 'can_export_reports', label: 'Export Reports', desc: 'Export reports to Excel/PDF' }
    ]
  },
  {
    group: 'Admin',
    color: '#f472b6',
    rows: [
      { key: 'can_manage_users', label: 'Manage Users', desc: 'Create and deactivate users' },
      { key: 'can_manage_roles', label: 'Manage Roles', desc: 'Create and edit roles' },
      { key: 'can_manage_branches', label: 'Branches', desc: 'Add and configure branches' },
      { key: 'can_manage_settings', label: 'Settings', desc: 'Change system settings' },
      { key: 'can_open_close_drawer', label: 'Cash Drawer', desc: 'Open and close cash drawers' },
      {
        key: 'can_approve_payouts',
        label: 'Approve Pay-Outs',
        desc: 'Approve or reject cash pay-out requests'
      },
      { key: 'can_view_all_branches', label: 'All Branches', desc: 'View data across all branches' }
    ]
  }
]

const ROLE_ACCENTS = ['#6366f1', '#10b981', '#f97316', '#8b5cf6', '#3b82f6', '#ec4899']
const TOTAL_PERMS = MATRIX.flatMap((g) => g.rows).length

function userInitial(name: string) {
  return (name || '?').charAt(0).toUpperCase()
}
const AVATAR_COLORS = ['#6366f1', '#10b981', '#f97316', '#8b5cf6', '#3b82f6', '#ec4899']
function avatarBg(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length]
}

// ─── Role card ────────────────────────────────────────────────────────────────
function RoleCard({
  role,
  idx,
  users,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onClone
}: {
  role: IPublicRole
  idx: number
  users: IPublicUser[]
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onClone: () => void
}) {
  const accent = ROLE_ACCENTS[idx % ROLE_ACCENTS.length]
  const assigned = users.filter((u) => u.roleId === role._id)
  const active = assigned.filter((u) => u.isActive)
  const pct = Math.round((role.permissions.length / TOTAL_PERMS) * 100)

  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? `${accent}12` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? accent + '50' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '16px',
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
      }}
    >
      {/* Top accent line */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: accent
          }}
        />
      )}

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              flexShrink: 0,
              background: `${accent}18`,
              border: `1px solid ${accent}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheckIcon style={{ width: '16px', height: '16px', color: accent }} />
          </div>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {role.name}
              {role.requiresSupervisorOverride && (
                <LockClosedIcon style={{ width: '11px', height: '11px', color: '#fbbf24' }} />
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
              {role.permissions.length} of {TOTAL_PERMS} permissions
            </div>
          </div>
        </div>

        {/* Actions — stop propagation */}
        <div style={{ display: 'flex', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
          {[
            {
              icon: <DocumentDuplicateIcon style={{ width: '12px', height: '12px' }} />,
              fn: onClone,
              title: 'Clone',
              hc: '#818cf8'
            },
            {
              icon: <PencilSquareIcon style={{ width: '12px', height: '12px' }} />,
              fn: onEdit,
              title: 'Edit',
              hc: '#fff'
            },
            {
              icon: <TrashIcon style={{ width: '12px', height: '12px' }} />,
              fn: onDelete,
              title: 'Delete',
              hc: '#f87171'
            }
          ].map((b, i) => (
            <button
              key={i}
              onClick={b.fn}
              title={b.title}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = b.hc
                e.currentTarget.style.background = 'rgba(255,255,255,0.10)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Coverage bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ height: '3px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)' }}>
          <div
            style={{
              height: '100%',
              borderRadius: '999px',
              width: `${pct}%`,
              background: accent,
              transition: 'width 0.4s'
            }}
          />
        </div>
      </div>

      {/* Users row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {assigned.length === 0 ? (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
              No users assigned
            </span>
          ) : (
            <>
              <div style={{ display: 'flex' }}>
                {assigned.slice(0, 4).map((u, i) => (
                  <div
                    key={u._id}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: avatarBg(u.name),
                      border: '2px solid #080810',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: 700,
                      color: '#fff',
                      marginLeft: i === 0 ? 0 : '-5px',
                      opacity: u.isActive ? 1 : 0.4
                    }}
                  >
                    {userInitial(u.name)}
                  </div>
                ))}
                {assigned.length > 4 && (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      border: '2px solid #080810',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      color: 'rgba(255,255,255,0.4)',
                      marginLeft: '-5px'
                    }}
                  >
                    +{assigned.length - 4}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                {active.length} active
              </span>
            </>
          )}
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: selected ? accent : 'rgba(255,255,255,0.25)'
          }}
        >
          {pct}%
        </span>
      </div>
    </div>
  )
}

// ─── Permission matrix ────────────────────────────────────────────────────────
function PermissionMatrix({
  roles,
  selectedId
}: {
  roles: IPublicRole[]
  selectedId: string | null
}) {
  // Label column is fixed; role columns are fixed-width so they don't stretch when few roles exist
  const COL_LABEL = '260px'
  const COL_ROLE = '120px'
  const gridCols = `${COL_LABEL} ${roles.map(() => COL_ROLE).join(' ')}`

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        overflowX: 'auto'
      }}
    >
      <div style={{ minWidth: `calc(${COL_LABEL} + ${roles.length} * ${COL_ROLE})` }}>
        {/* Matrix header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.07)'
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em'
            }}
          >
            Permission
          </div>
          {roles.map((role, i) => {
            const accent = ROLE_ACCENTS[i % ROLE_ACCENTS.length]
            const isSelected = role._id === selectedId
            return (
              <div
                key={role._id}
                style={{
                  padding: '10px 8px',
                  textAlign: 'center',
                  borderLeft: '1px solid rgba(255,255,255,0.05)',
                  background: isSelected ? `${accent}08` : 'transparent',
                  borderTop: isSelected ? `2px solid ${accent}` : '2px solid transparent'
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isSelected ? accent : 'rgba(255,255,255,0.65)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {role.name}
                </div>
                <div
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '1px' }}
                >
                  {role.permissions.length}/{TOTAL_PERMS}
                </div>
              </div>
            )
          })}
        </div>

        {/* Permission rows grouped by category */}
        {MATRIX.map((group, gi) => (
          <div key={group.group}>
            {/* Group header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                background: `${group.color}08`,
                borderTop: gi > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none'
              }}
            >
              <div
                style={{ padding: '7px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: group.color,
                    flexShrink: 0
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: group.color
                  }}
                >
                  {group.group}
                </span>
              </div>
              {roles.map((role, i) => {
                const accent = ROLE_ACCENTS[i % ROLE_ACCENTS.length]
                const isSelected = role._id === selectedId
                const groupCount = group.rows.filter((r) => role.permissions.includes(r.key)).length
                return (
                  <div
                    key={role._id}
                    style={{
                      padding: '7px 8px',
                      textAlign: 'center',
                      borderLeft: '1px solid rgba(255,255,255,0.04)',
                      background: isSelected ? `${accent}06` : 'transparent'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color:
                          groupCount === group.rows.length ? group.color : 'rgba(255,255,255,0.22)'
                      }}
                    >
                      {groupCount}/{group.rows.length}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Individual permission rows */}
            {group.rows.map((row) => (
              <div
                key={row.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridCols,
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }}
              >
                <div style={{ padding: '9px 20px' }}>
                  <div
                    style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}
                  >
                    {row.desc}
                  </div>
                </div>
                {roles.map((role, i) => {
                  const accent = ROLE_ACCENTS[i % ROLE_ACCENTS.length]
                  const isSelected = role._id === selectedId
                  const has = role.permissions.includes(row.key)
                  return (
                    <div
                      key={role._id}
                      style={{
                        borderLeft: '1px solid rgba(255,255,255,0.04)',
                        background: isSelected ? `${accent}05` : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {has ? (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            background: `${isSelected ? accent : group.color}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <CheckIcon
                            style={{
                              width: '11px',
                              height: '11px',
                              color: isSelected ? accent : group.color
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)'
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const { rolesQuery, createMutation, updateMutation, deleteMutation } = useRoles()
  const { usersQuery } = useUsers()

  const [editRole, setEditRole] = useState<IPublicRole | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [cloneBase, setCloneBase] = useState<IPublicRole | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const roles = rolesQuery.data ?? []
  const users = usersQuery.data ?? []

  async function handleCreate(data: CreateRoleInput) {
    try {
      await createMutation.mutateAsync(data)
      setShowCreate(false)
      setCloneBase(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create role')
    }
  }
  async function handleUpdate(data: CreateRoleInput) {
    if (!editRole) return
    try {
      await updateMutation.mutateAsync({ id: editRole._id, input: data })
      setEditRole(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }
  async function handleDelete(role: IPublicRole) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return
    try {
      await deleteMutation.mutateAsync(role._id)
      if (selectedId === role._id) setSelectedId(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete role')
    }
  }

  const modalRole = cloneBase
    ? ({ ...cloneBase, _id: '', name: `${cloneBase.name} (Copy)` } as IPublicRole)
    : editRole

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
      >
        {/* Action bar */}
        <div
          style={{
            padding: '20px 36px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>Access Control Matrix</h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                {rolesQuery.isLoading
                  ? 'Loading…'
                  : `${roles.length} roles · ${users.filter((u) => u.isActive).length} active users · ${TOTAL_PERMS} permissions`}
              </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <PlusIcon style={{ width: '16px', height: '16px' }} /> New Role
          </button>
        </div>

        {error && (
          <div
            style={{
              margin: '0 36px 16px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.14)',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <XMarkIcon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
            {error}
            <button
              onClick={() => setError('')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#f87171'
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div
          style={{
            padding: '0 36px 36px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Role cards */}
          {rolesQuery.isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.35)',
                padding: '40px 0'
              }}
            >
              <div
                className="animate-spin"
                style={{
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.08)',
                  borderTopColor: '#6366f1'
                }}
              />
              Loading roles…
            </div>
          ) : roles.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                padding: '64px 20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: '16px',
                textAlign: 'center'
              }}
            >
              <ShieldCheckIcon
                style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.2)' }}
              />
              <div>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.5)',
                    margin: 0
                  }}
                >
                  No roles defined yet
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
                  Create your first role to assign permissions to staff
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-secondary flex items-center gap-2 px-4 py-2"
              >
                <PlusIcon style={{ width: '15px', height: '15px' }} /> Create First Role
              </button>
            </div>
          ) : (
            <>
              {/* Cards grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '12px'
                }}
              >
                {roles.map((role, idx) => (
                  <RoleCard
                    key={role._id}
                    role={role}
                    idx={idx}
                    users={users}
                    selected={selectedId === role._id}
                    onSelect={() => setSelectedId((id) => (id === role._id ? null : role._id))}
                    onEdit={() => setEditRole(role)}
                    onDelete={() => handleDelete(role)}
                    onClone={() => setCloneBase(role)}
                  />
                ))}
              </div>

              {/* Permission matrix */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}
                >
                  <span
                    style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}
                  >
                    Permission Matrix
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                    — click a role card to highlight it
                  </span>
                </div>
                <PermissionMatrix roles={roles} selectedId={selectedId} />
              </div>
            </>
          )}
        </div>
      </div>

      {(showCreate || editRole || cloneBase) && (
        <RoleFormModal
          role={modalRole}
          onConfirm={editRole ? handleUpdate : handleCreate}
          onClose={() => {
            setShowCreate(false)
            setEditRole(null)
            setCloneBase(null)
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}
