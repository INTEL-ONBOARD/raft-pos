import { useState, useEffect, useMemo } from 'react'
import { X, Package } from 'lucide-react'
import { useCategoryStore } from '../../stores/category.store'
import type { IProduct, CreateProductInput, ProductUnit } from '@shared/types/product.types'

const UNITS: ProductUnit[] = ['pcs', 'kg', 'm', 'box', 'roll', 'set', 'pair']

interface Props {
  product?: IProduct | null
  onSave: (input: CreateProductInput) => Promise<void>
  onClose: () => void
  loading: boolean
  error: string | null
}

const empty: CreateProductInput = {
  sku: '', name: '', description: '', categoryId: null,
  unit: 'pcs', costPrice: 0, sellingPrice: 0, barcode: '', taxRate: null
}

export function ProductFormModal({ product, onSave, onClose, loading, error }: Props) {
  const allCategories = useCategoryStore(s => s.categories)
  const categories = useMemo(() => allCategories.filter(c => c.isActive), [allCategories])
  const [form, setForm] = useState<CreateProductInput>(empty)

  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        unit: product.unit,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        barcode: product.barcode,
        taxRate: product.taxRate
      })
    } else {
      setForm(empty)
    }
  }, [product])

  function set<K extends keyof CreateProductInput>(key: K, val: CreateProductInput[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.10)' }}>
              <Package className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {product ? 'Edit Product' : 'Add Product'}
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
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-sku" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>SKU *</label>
              <input id="p-sku" value={form.sku} onChange={e => set('sku', e.target.value)}
                className="dark-input uppercase mt-1"
                placeholder="e.g. HW-001" />
            </div>
            <div>
              <label htmlFor="p-barcode" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Barcode</label>
              <input id="p-barcode" value={form.barcode ?? ''} onChange={e => set('barcode', e.target.value)}
                className="dark-input mt-1" />
            </div>
          </div>

          <div>
            <label htmlFor="p-name" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Product Name *</label>
            <input id="p-name" value={form.name} onChange={e => set('name', e.target.value)}
              className="dark-input mt-1"
              placeholder="e.g. 3/4 inch PVC Pipe" />
          </div>

          <div>
            <label htmlFor="p-desc" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Description</label>
            <textarea id="p-desc" value={form.description ?? ''} onChange={e => set('description', e.target.value)}
              rows={2}
              className="dark-input resize-none mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-cat" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Category</label>
              <select id="p-cat" value={form.categoryId ?? ''} onChange={e => set('categoryId', e.target.value || null)}
                className="dark-select mt-1">
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="p-unit" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Unit *</label>
              <select id="p-unit" value={form.unit} onChange={e => set('unit', e.target.value as ProductUnit)}
                className="dark-select mt-1">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="p-cost" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Cost Price *</label>
              <input id="p-cost" type="number" min="0" step="0.01" inputMode="decimal" value={form.costPrice}
                onChange={e => set('costPrice', parseFloat(e.target.value) || 0)}
                className="dark-input mt-1" />
            </div>
            <div>
              <label htmlFor="p-sell" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Selling Price *</label>
              <input id="p-sell" type="number" min="0" step="0.01" inputMode="decimal" value={form.sellingPrice}
                onChange={e => set('sellingPrice', parseFloat(e.target.value) || 0)}
                className="dark-input mt-1" />
            </div>
            <div>
              <label htmlFor="p-tax" style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Tax Rate % (null=global)</label>
              <input id="p-tax" type="number" min="0" max="100" step="0.01" inputMode="decimal"
                value={form.taxRate ?? ''}
                onChange={e => set('taxRate', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Use global"
                className="dark-input mt-1" />
            </div>
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
          <button onClick={() => onSave(form)} disabled={loading}
            className="btn-primary px-5 py-2 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>

      </div>
    </div>
  )
}
