import { useState, useMemo } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  QrCodeIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline'
import { useQueryClient } from '@tanstack/react-query'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useCategoryStore } from '../../stores/category.store'
import { ProductFormModal } from './ProductFormModal'
import { BarcodeModal } from './BarcodeModal'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type { IProduct, CreateProductInput } from '@shared/types/product.types'

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

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [editProduct, setEditProduct] = useState<IProduct | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{
    imported: number
    errors: Array<{ row: number; sku: string; error: string }>
  } | null>(null)
  const [importing, setImporting] = useState(false)
  const [barcodeProduct, setBarcodeProduct] = useState<IProduct | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { query, create, update, deactivate } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    isActive: showInactive ? undefined : true
  })
  useCategories()
  const allCategories = useCategoryStore((s) => s.categories)
  const categories = useMemo(() => allCategories.filter((c) => c.isActive), [allCategories])

  async function handleSave(input: CreateProductInput) {
    setFormError(null)
    if (!input.sku.trim() || !input.name.trim()) {
      setFormError('SKU and Name are required')
      return
    }
    const res = editProduct
      ? await update.mutateAsync({ id: editProduct._id, input })
      : await create.mutateAsync(input)
    if (!res.success) {
      setFormError(res.error ?? 'Failed')
      return
    }
    setShowForm(false)
    setEditProduct(null)
  }

  function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    result.push(cur.trim())
    return result
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const lines = text
        .trim()
        .split(/\r?\n/)
        .filter((l) => l.trim())
      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
      const rows = lines.slice(1).map((line) => {
        const vals = parseCsvLine(line)
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
      })
      const res = await ipc.invoke<{ success: boolean; data?: any; error?: string }>(
        IPC.PRODUCTS_IMPORT_CSV,
        { rows }
      )
      if (res.success) {
        setImportResult(res.data)
        queryClient.invalidateQueries({ queryKey: ['products'] })
      } else {
        alert(res.error ?? 'Import failed')
      }
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const products = query.data?.data ?? []
  const total = query.data?.total ?? 0
  const isLoading = create.isPending || update.isPending

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
            <CubeIcon style={{ width: 18, height: 18, color: '#818cf8' }} />
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
              Products
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
              {total} product{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label
            className={`btn-secondary flex items-center gap-2 px-4 py-2 cursor-pointer ${importing ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
            {importing ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCsv}
              disabled={importing}
            />
          </label>
          <button
            onClick={() => {
              setShowForm(true)
              setEditProduct(null)
              setFormError(null)
            }}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <PlusIcon style={{ width: 16, height: 16 }} /> Add Product
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 36px 36px', flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
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
              placeholder="Search products..."
              className="dark-input w-full text-sm"
              style={{ paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8 }}
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="dark-select px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
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

        {/* Table container */}
        <div style={tableContainerStyle}>
          {query.isLoading ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['SKU', 'Name', 'Category', 'Unit', 'Cost', 'Price', 'Status', ''].map(
                    (h, i) => (
                      <th key={h || i} style={i === 7 ? thRightStyle : thStyle}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} style={tdStyle}>
                        <div
                          className="animate-pulse"
                          style={{
                            height: 14,
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.06)',
                            width: j === 1 ? 120 : j === 7 ? 60 : 80
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : products.length === 0 ? (
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
                <CubeIcon style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.25)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
                  No products found
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>
                  Try adjusting your search or filters.
                </p>
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['SKU', 'Name', 'Category', 'Unit', 'Cost', 'Price', 'Status', ''].map(
                    (h, i) => (
                      <th key={h || i} style={i === 7 ? thRightStyle : thStyle}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const cat = categories.find((c) => c._id === p.categoryId)
                  const isHovered = hoveredRow === p._id
                  return (
                    <tr
                      key={p._id}
                      onMouseEnter={() => setHoveredRow(p._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                    >
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 13,
                            color: 'rgba(255,255,255,0.45)'
                          }}
                        >
                          {p.sku}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}
                        >
                          {p.name}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                          {cat?.name ?? '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                          {p.unit}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                          ₱{(p.costPrice ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}
                        >
                          ₱{(p.sellingPrice ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {p.isActive ? (
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
                            onClick={() => setBarcodeProduct(p)}
                            style={{
                              color: 'rgba(255,255,255,0.30)',
                              padding: '4px 6px',
                              borderRadius: 6,
                              transition: 'color 0.15s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')
                            }
                            title="View barcode"
                            aria-label={`View barcode for ${p.name}`}
                          >
                            <QrCodeIcon style={{ width: 16, height: 16 }} />
                          </button>
                          <button
                            onClick={() => {
                              setEditProduct(p)
                              setShowForm(true)
                              setFormError(null)
                            }}
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
                            title="Edit product"
                            aria-label={`Edit ${p.name}`}
                          >
                            <PencilSquareIcon style={{ width: 16, height: 16 }} />
                          </button>
                          {p.isActive && (
                            <button
                              onClick={() => {
                                if (confirm('Deactivate this product?')) deactivate.mutate(p._id)
                              }}
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
                              title="Deactivate product"
                              aria-label={`Deactivate ${p.name}`}
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
          )}
        </div>

        {showForm && (
          <ProductFormModal
            product={editProduct}
            onSave={handleSave}
            onClose={() => {
              setShowForm(false)
              setEditProduct(null)
            }}
            loading={isLoading}
            error={formError}
          />
        )}

        {barcodeProduct && (
          <BarcodeModal product={barcodeProduct} onClose={() => setBarcodeProduct(null)} />
        )}

        {importResult && (
          <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="rounded-xl shadow-xl w-full max-w-lg p-6 modal-panel">
              <h3
                className="text-base font-semibold mb-3"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              >
                Import Complete
              </h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <span className="font-medium" style={{ color: '#16a34a' }}>
                  {importResult.imported} product{importResult.imported !== 1 ? 's' : ''} imported
                </span>
                {importResult.errors.length > 0 && (
                  <span className="ml-2" style={{ color: '#dc2626' }}>
                    · {importResult.errors.length} error
                    {importResult.errors.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
              {importResult.errors.length > 0 && (
                <div
                  className="max-h-48 overflow-y-auto rounded-lg p-3 space-y-1 text-xs"
                  style={{
                    background: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.15)',
                    color: '#dc2626',
                    borderRadius: '0.75rem'
                  }}
                >
                  {importResult.errors.map((e, i) => (
                    <p key={i}>
                      Row {e.row} ({e.sku}): {e.error}
                    </p>
                  ))}
                </div>
              )}
              <button onClick={() => setImportResult(null)} className="btn-primary mt-4 px-4 py-2">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
