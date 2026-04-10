// src/renderer/src/pages/roles/RoleFormModal.tsx
import { useState, useEffect } from 'react'
import { X, Shield } from 'lucide-react'
import type { IPublicRole, CreateRoleInput } from '@shared/types/role.types'
import type { Permission } from '@shared/types/permissions'

interface Props {
  role?: IPublicRole | null
  onConfirm: (data: CreateRoleInput) => void
  onClose: () => void
  isLoading: boolean
}

// Grouped permissions structure for better UI organization
type PermissionMatrixRow = { key: Permission; label: string; desc: string }
type PermissionMatrixGroup = { group: string; color: string; rows: PermissionMatrixRow[] }

const GROUPS: PermissionMatrixGroup[] = [
  {
    group: 'Sales & Transactions', color: '#34d399',
    rows: [
      { key: 'can_make_sale', label: 'Make Sale', desc: 'Process sales at POS' },
      { key: 'can_apply_discount', label: 'Apply Discount', desc: 'Line-item discounts' },
      { key: 'can_apply_order_discount', label: 'Order Discount', desc: 'Ticket-level discounts' },
      { key: 'can_void_transaction', label: 'Void Transaction', desc: 'Void entire tickets' },
      { key: 'can_refund_transaction', label: 'Refund', desc: 'Issue partial or full refunds' },
      { key: 'can_reprint_receipt', label: 'Reprint Receipt', desc: 'Reprint past receipts' }
    ]
  },
  {
    group: 'Inventory Management', color: '#60a5fa',
    rows: [
      { key: 'can_manage_products', label: 'Products', desc: 'Create & edit items' },
      { key: 'can_manage_categories', label: 'Categories', desc: 'Manage departments' },
      { key: 'can_manage_inventory', label: 'Inventory', desc: 'Adjust stock counts' },
      { key: 'can_manage_suppliers', label: 'Suppliers', desc: 'Manage vendor records' },
      { key: 'can_manage_purchase_orders', label: 'Purchase Orders', desc: 'Create & receive POs' }
    ]
  },
  {
    group: 'Stock Transfers', color: '#a78bfa',
    rows: [
      { key: 'can_approve_stock_transfer', label: 'Approve Outbound', desc: 'Send stock' },
      { key: 'can_receive_stock_transfer', label: 'Receive Inbound', desc: 'Accept stock' }
    ]
  },
  {
    group: 'Analytics & Reporting', color: '#fb923c',
    rows: [
      { key: 'can_view_reports', label: 'View Reports', desc: 'Access dashboards' },
      { key: 'can_export_reports', label: 'Export Reports', desc: 'Export to Excel/PDF' }
    ]
  },
  {
    group: 'System Administration', color: '#f472b6',
    rows: [
      { key: 'can_manage_users', label: 'Manage Staff', desc: 'Create & suspend users' },
      { key: 'can_manage_roles', label: 'Manage Roles', desc: 'Edit access matrices' },
      { key: 'can_manage_branches', label: 'Branches', desc: 'System branch configs' },
      { key: 'can_manage_settings', label: 'Global Settings', desc: 'Tax, receipts, etc.' },
      { key: 'can_open_close_drawer', label: 'Cash Drawer', desc: 'Manual open auth' },
      { key: 'can_approve_payouts', label: 'Pay-Outs', desc: 'Cash management auth' },
      { key: 'can_view_all_branches', label: 'All Branches', desc: 'Cross-branch visibility' }
    ]
  }
]

export function RoleFormModal({ role, onConfirm, onClose, isLoading }: Props) {
  const [name, setName] = useState(role?.name ?? '')
  const [permissions, setPermissions] = useState<Permission[]>(role?.permissions ?? [])
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(role?.maxDiscountPercent ?? 0)
  const [requiresSupervisorOverride, setRequiresSupervisorOverride] = useState(
    role?.requiresSupervisorOverride ?? false
  )
  const [error, setError] = useState('')

  useEffect(() => {
    if (role) {
      setName(role.name)
      setPermissions(role.permissions)
      setMaxDiscountPercent(role.maxDiscountPercent)
      setRequiresSupervisorOverride(role.requiresSupervisorOverride)
    }
  }, [role])

  function togglePermission(p: Permission) {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function handleGroupToggle(groupRows: PermissionMatrixRow[]) {
    const groupKeys = groupRows.map(r => r.key)
    const allSelected = groupKeys.every(k => permissions.includes(k))
    
    if (allSelected) {
      setPermissions(prev => prev.filter(p => !groupKeys.includes(p)))
    } else {
      setPermissions(prev => {
        const newPerms = new Set(prev)
        groupKeys.forEach(k => newPerms.add(k))
        return Array.from(newPerms)
      })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Role name is required')
    onConfirm({ name, permissions, maxDiscountPercent, requiresSupervisorOverride })
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)' }}
            >
              <Shield className="w-5 h-5" style={{ color: '#818cf8' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {role ? 'Edit Role Details' : 'Register New Role'}
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: '2px' }}>
                Configure access levels and POS limits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-[#00000020]">
          
          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-5">
              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '10px', color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <X className="w-4 h-4" /> {error}
                </div>
              )}

              {/* Core Details */}
              <div className="grid grid-cols-2 gap-5 p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="col-span-2">
                  <label htmlFor="role-name" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>
                    Role Name *
                  </label>
                  <input
                    id="role-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="dark-input w-full"
                    placeholder="e.g. Senior Cashier"
                  />
                </div>
                <div>
                  <label htmlFor="role-max-discount" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>
                    Max Allowed Discount %
                  </label>
                  <input
                    id="role-max-discount"
                    type="number"
                    min="0"
                    max="100"
                    inputMode="decimal"
                    value={maxDiscountPercent}
                    onChange={(e) => setMaxDiscountPercent(Number(e.target.value))}
                    className="dark-input w-full"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-colors hover:bg-white/5 border border-transparent hover:border-white/10 w-full h-full mt-4">
                    <input
                      type="checkbox"
                      checked={requiresSupervisorOverride}
                      onChange={(e) => setRequiresSupervisorOverride(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-500 bg-white/5 border-white/20"
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Supervisor Override</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Require PIN lock on terminal</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Matrix Layout */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Access Control Matrix</p>
                <div className="space-y-4">
                  {GROUPS.map((group) => {
                    const groupKeys = group.rows.map(r => r.key)
                    const selectedCount = groupKeys.filter(k => permissions.includes(k)).length
                    const isAll = selectedCount === groupKeys.length
                    
                    return (
                      <div key={group.group} style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', overflow: 'hidden' }}>
                        {/* Group Header */}
                        <div className="flex items-center justify-between px-5 py-3" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <div className="flex items-center gap-3">
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: group.color }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{group.group}</span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                              {selectedCount} / {groupKeys.length}
                            </span>
                          </div>
                          <button type="button" onClick={() => handleGroupToggle(group.rows)} style={{ fontSize: '11px', fontWeight: 600, color: group.color, background: `${group.color}15`, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${group.color}30` }}>
                            {isAll ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        {/* Group Grid */}
                        <div className="grid grid-cols-2 gap-[1px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          {group.rows.map(row => {
                            const isChecked = permissions.includes(row.key)
                            return (
                              <label key={row.key} className="flex items-start gap-3 p-4 cursor-pointer transition-colors" style={{ background: isChecked ? `${group.color}08` : 'rgba(10,10,12,0.95)' }} onMouseEnter={(e) => {if(!isChecked) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}} onMouseLeave={(e) => {if(!isChecked) e.currentTarget.style.background = 'rgba(10,10,12,0.95)'}}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(row.key)}
                                  className="mt-1"
                                />
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: isChecked ? '#fff' : 'rgba(255,255,255,0.7)' }}>{row.label}</div>
                                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', lineHeight: '1.4' }}>{row.desc}</div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div
            className="flex justify-end gap-3 px-6 py-4 shrink-0 bg-black/20"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <button type="button" onClick={onClose} className="btn-secondary px-6 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-6 py-2 disabled:opacity-50 min-w-[140px]"
            >
              {isLoading ? 'Processing...' : role ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
