import { useState, useMemo } from 'react'
import { Plus, Search, Pencil, PowerOff, Upload, Barcode, Package } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useCategoryStore } from '../../stores/category.store'
import { ProductFormModal } from './ProductFormModal'
import { BarcodeModal } from './BarcodeModal'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type { IProduct, CreateProductInput } from '@shared/types/product.types'

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [editProduct, setEditProduct] = useState<IProduct | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; errors: Array<{ row: number; sku: string; error: string }> } | null>(null)
  const [importing, setImporting] = useState(false)
  const [barcodeProduct, setBarcodeProduct] = useState<IProduct | null>(null)

  const queryClient = useQueryClient()

  const { query, create, update, deactivate } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    isActive: showInactive ? undefined : true
  })
  useCategories()
  const allCategories = useCategoryStore(s => s.categories)
  const categories = useMemo(() => allCategories.filter(c => c.isActive), [allCategories])

  async function handleSave(input: CreateProductInput) {
    setFormError(null)
    if (!input.sku.trim() || !input.name.trim()) {
      setFormError('SKU and Name are required')
      return
    }
    const res = editProduct
      ? await update.mutateAsync({ id: editProduct._id, input })
      : await create.mutateAsync(input)
    if (!res.success) { setFormError(res.error ?? 'Failed'); return }
    setShowForm(false); setEditProduct(null)
  }

  function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim()); cur = ''
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
      const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase())
      const rows = lines.slice(1).map(line => {
        const vals = parseCsvLine(line)
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
      })
      const res = await ipc.invoke<{ success: boolean; data?: any; error?: string }>(
        IPC.PRODUCTS_IMPORT_CSV, { rows }
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
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <Package className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Products</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{total} product{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className={`btn-secondary flex items-center gap-2 px-4 py-2 cursor-pointer ${importing ? 'opacity-60 pointer-events-none' : ''}`}>
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import CSV'}
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} disabled={importing} />
          </label>
          <button
            onClick={() => { setShowForm(true); setEditProduct(null); setFormError(null) }}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>
      <div className="p-6 flex-1">

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="dark-input w-full pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
          className="dark-select px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)}
            className="rounded" />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="content-card overflow-hidden">
        {query.isLoading ? (
          <table className="dark-table">
            <thead>
              <tr>
                {['SKU', 'Name', 'Category', 'Unit', 'Cost', 'Price', 'Status', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}>
                      <div className="h-4 rounded animate-pulse" style={{ background: 'var(--border-subtle)', width: j === 1 ? '120px' : j === 7 ? '60px' : '80px' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <Package className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="text-center">
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No products found</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          <table className="dark-table">
            <thead>
              <tr>
                {['SKU', 'Name', 'Category', 'Unit', 'Cost', 'Price', 'Status', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const cat = categories.find(c => c._id === p.categoryId)
                return (
                  <tr key={p._id}>
                    <td className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>{p.sku}</td>
                    <td className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat?.name ?? '—'}</td>
                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.unit}</td>
                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>₱{(p.costPrice ?? 0).toFixed(2)}</td>
                    <td className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>₱{(p.sellingPrice ?? 0).toFixed(2)}</td>
                    <td>
                      {p.isActive ? <span className="badge-green">Active</span> : <span className="badge-gray">Inactive</span>}
                    </td>
                    <td className="text-right row-actions">
                      <button onClick={() => setBarcodeProduct(p)}
                        className="mr-2 transition-colors" style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#4F46E5')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="View barcode" aria-label={`View barcode for ${p.name}`}>
                        <Barcode className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditProduct(p); setShowForm(true); setFormError(null) }}
                        className="mr-2 transition-colors" style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="Edit product" aria-label={`Edit ${p.name}`}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      {p.isActive && (
                        <button onClick={() => { if (confirm('Deactivate this product?')) deactivate.mutate(p._id) }}
                          className="transition-colors" style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Deactivate product" aria-label={`Deactivate ${p.name}`}>
                          <PowerOff className="w-4 h-4" />
                        </button>
                      )}
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
          onClose={() => { setShowForm(false); setEditProduct(null) }}
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
            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Import Complete</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-medium" style={{ color: '#16a34a' }}>{importResult.imported} product{importResult.imported !== 1 ? 's' : ''} imported</span>
              {importResult.errors.length > 0 && <span className="ml-2" style={{ color: '#dc2626' }}>· {importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''}</span>}
            </p>
            {importResult.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg p-3 space-y-1 text-xs"
                style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626', borderRadius: '0.75rem' }}>
                {importResult.errors.map((e, i) => (
                  <p key={i}>Row {e.row} ({e.sku}): {e.error}</p>
                ))}
              </div>
            )}
            <button onClick={() => setImportResult(null)}
              className="btn-primary mt-4 px-4 py-2">Done</button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
