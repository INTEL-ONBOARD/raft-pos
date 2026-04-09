// src/renderer/src/pages/suppliers/SuppliersPage.tsx
import { useState } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TruckIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline'
import { useSuppliers } from '../../hooks/useSuppliers'
import { SupplierFormModal } from './SupplierFormModal'
import type { ISupplier } from '@shared/types/supplier.types'

// ── Shared inline style tokens ──────────────────────────────────────────────
const tableContainerStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  overflow: 'hidden'
}

const thStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  color: 'rgba(255,255,255,0.28)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '10px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  textAlign: 'left',
  whiteSpace: 'nowrap'
}

const thRightStyle: React.CSSProperties = { ...thStyle, textAlign: 'right' }

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  verticalAlign: 'middle'
}

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modalSupplier, setModalSupplier] = useState<ISupplier | null | undefined>(undefined)
  const [deactivateError, setDeactivateError] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const { query, deactivate } = useSuppliers({ includeInactive: showInactive })
  const suppliers = query.data?.data ?? []

  const filtered = suppliers.filter(
    (s) =>
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: '#080810',
        position: 'relative'
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 36px 20px',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(99,102,241,0.12)',
              flexShrink: 0
            }}
          >
            <TruckIcon style={{ width: 18, height: 18, color: '#818cf8' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.92)',
                lineHeight: 1.2
              }}
            >
              Suppliers
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
              {filtered.length} supplier{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalSupplier(null)}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <PlusIcon style={{ width: 16, height: 16 }} /> Add Supplier
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '0 36px 36px',
          flex: 1,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        {/* Error banner */}
        {deactivateError && (
          <div
            style={{
              padding: '12px 16px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 12,
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.15)',
              color: '#dc2626'
            }}
          >
            {deactivateError}
            <button
              onClick={() => setDeactivateError('')}
              style={{
                marginLeft: 8,
                opacity: 0.7,
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Search & filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <MagnifyingGlassIcon
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 15,
                height: 15,
                color: 'rgba(255,255,255,0.30)'
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, contact, phone..."
              className="dark-input w-full text-sm"
              style={{ paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8 }}
            />
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'rgba(255,255,255,0.45)',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Show inactive
          </label>
        </div>

        {/* Table */}
        {query.isLoading ? (
          <div style={tableContainerStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Contact Person', 'Phone', 'Email', 'Status', ''].map((h, i) => (
                    <th key={h || i} style={i === 5 ? thRightStyle : thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} style={tdStyle}>
                        <div
                          className="animate-pulse"
                          style={{
                            height: 14,
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.06)',
                            width: j === 0 ? 120 : j === 5 ? 60 : 90
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : query.isError ? (
          <div style={{ fontSize: 13, padding: '16px 0', color: '#dc2626' }}>
            Failed to load suppliers.
          </div>
        ) : filtered.length === 0 ? (
          <div style={tableContainerStyle}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 0',
                gap: 12
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <TruckIcon style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.25)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
                  No suppliers found
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>
                  Try adjusting your search or filters.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={tableContainerStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Contact Person', 'Phone', 'Email', 'Status', ''].map((h, i) => (
                    <th key={h || i} style={i === 5 ? thRightStyle : thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => {
                  const isHovered = hoveredRow === supplier._id
                  return (
                    <tr
                      key={supplier._id}
                      onMouseEnter={() => setHoveredRow(supplier._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                    >
                      <td style={tdStyle}>
                        <span
                          style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}
                        >
                          {supplier.name}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                          {supplier.contactPerson || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                          {supplier.phone || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                          {supplier.email || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {supplier.isActive ? (
                          <span className="badge-green">Active</span>
                        ) : (
                          <span className="badge-gray">Inactive</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 4
                          }}
                        >
                          <button
                            onClick={() => setModalSupplier(supplier)}
                            style={{
                              color: 'rgba(255,255,255,0.30)',
                              padding: '4px 6px',
                              borderRadius: 6,
                              transition: 'color 0.15s'
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')
                            }
                            title="Edit"
                            aria-label={`Edit ${supplier.name}`}
                          >
                            <PencilSquareIcon style={{ width: 16, height: 16 }} />
                          </button>
                          {supplier.isActive && (
                            <button
                              onClick={() => handleDeactivate(supplier)}
                              style={{
                                color: 'rgba(255,255,255,0.30)',
                                padding: '4px 6px',
                                borderRadius: 6,
                                transition: 'color 0.15s'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')
                              }
                              title="Deactivate"
                              aria-label={`Deactivate ${supplier.name}`}
                            >
                              <NoSymbolIcon style={{ width: 16, height: 16 }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {modalSupplier !== undefined && (
          <SupplierFormModal supplier={modalSupplier} onClose={() => setModalSupplier(undefined)} />
        )}
      </div>
    </div>
  )
}
