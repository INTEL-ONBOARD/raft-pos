// src/renderer/src/pages/suppliers/SuppliersPage.tsx
import { useState } from 'react'
import { Plus, Search, Pencil, PowerOff, Truck } from 'lucide-react'
import { useSuppliers } from '../../hooks/useSuppliers'
import { SupplierFormModal } from './SupplierFormModal'
import type { ISupplier } from '@shared/types/supplier.types'

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modalSupplier, setModalSupplier] = useState<ISupplier | null | undefined>(undefined)
  const [deactivateError, setDeactivateError] = useState('')

  const { query, deactivate } = useSuppliers({ includeInactive: showInactive })
  const suppliers = query.data?.data ?? []

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  )

  async function handleDeactivate(supplier: ISupplier) {
    if (!confirm(`Deactivate "${supplier.name}"?`)) return
    try {
      await deactivate.mutateAsync(supplier._id)
    } catch (err: any) {
      setDeactivateError(err.message ?? 'Failed to deactivate supplier')
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <Truck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Suppliers</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{filtered.length} supplier{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setModalSupplier(null)}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>
      <div className="p-6 flex-1 space-y-4">

      {deactivateError && (
        <div className="px-4 py-3 text-sm flex items-center justify-between rounded-xl"
          style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626' }}>
          {deactivateError}
          <button onClick={() => setDeactivateError('')} className="ml-2 hover:opacity-70">×</button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, contact, phone..."
            className="dark-input w-full pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
          Show inactive
        </label>
      </div>

      {query.isLoading ? (
        <div className="content-card overflow-hidden">
          <table className="dark-table">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Contact Person</th>
                <th className="text-left">Phone</th>
                <th className="text-left">Email</th>
                <th className="text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}>
                      <div className="h-4 rounded animate-pulse" style={{ background: 'var(--border-subtle)', width: j === 0 ? '120px' : j === 6 ? '60px' : '90px' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : query.isError ? (
        <div className="text-sm py-4" style={{ color: '#dc2626' }}>Failed to load suppliers.</div>
      ) : filtered.length === 0 ? (
        <div className="content-card overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <Truck className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="text-center">
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No suppliers found</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Try adjusting your search or filters.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="content-card overflow-hidden">
          <table className="dark-table">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Contact Person</th>
                <th className="text-left">Phone</th>
                <th className="text-left">Email</th>
                <th className="text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(supplier => (
                <tr key={supplier._id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{supplier.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{supplier.contactPerson || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{supplier.phone || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{supplier.email || '—'}</td>
                  <td>
                    {supplier.isActive ? <span className="badge-green">Active</span> : <span className="badge-gray">Inactive</span>}
                  </td>
                  <td className="row-actions">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModalSupplier(supplier)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="Edit"
                        aria-label={`Edit ${supplier.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {supplier.isActive && (
                        <button
                          onClick={() => handleDeactivate(supplier)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Deactivate"
                          aria-label={`Deactivate ${supplier.name}`}
                        >
                          <PowerOff className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalSupplier !== undefined && (
        <SupplierFormModal
          supplier={modalSupplier}
          onClose={() => setModalSupplier(undefined)}
        />
      )}
      </div>
    </div>
  )
}
