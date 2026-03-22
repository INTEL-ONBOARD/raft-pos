import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
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
  const categories = useCategoryStore(s => s.categories.filter(c => c.isActive))
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-sku" className="block text-xs font-medium text-gray-600 mb-1">SKU *</label>
              <input id="p-sku" value={form.sku} onChange={e => set('sku', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="e.g. HW-001" />
            </div>
            <div>
              <label htmlFor="p-barcode" className="block text-xs font-medium text-gray-600 mb-1">Barcode</label>
              <input id="p-barcode" value={form.barcode ?? ''} onChange={e => set('barcode', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label htmlFor="p-name" className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
            <input id="p-name" value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 3/4 inch PVC Pipe" />
          </div>

          <div>
            <label htmlFor="p-desc" className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea id="p-desc" value={form.description ?? ''} onChange={e => set('description', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-cat" className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select id="p-cat" value={form.categoryId ?? ''} onChange={e => set('categoryId', e.target.value || null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="p-unit" className="block text-xs font-medium text-gray-600 mb-1">Unit *</label>
              <select id="p-unit" value={form.unit} onChange={e => set('unit', e.target.value as ProductUnit)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="p-cost" className="block text-xs font-medium text-gray-600 mb-1">Cost Price *</label>
              <input id="p-cost" type="number" min="0" step="0.01" value={form.costPrice}
                onChange={e => set('costPrice', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="p-sell" className="block text-xs font-medium text-gray-600 mb-1">Selling Price *</label>
              <input id="p-sell" type="number" min="0" step="0.01" value={form.sellingPrice}
                onChange={e => set('sellingPrice', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="p-tax" className="block text-xs font-medium text-gray-600 mb-1">Tax Rate % (null=global)</label>
              <input id="p-tax" type="number" min="0" max="100" step="0.01"
                value={form.taxRate ?? ''}
                onChange={e => set('taxRate', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Use global"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button onClick={() => onSave(form)} disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg text-sm font-medium">
            {loading ? 'Saving...' : 'Save Product'}
          </button>
          <button onClick={onClose} className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
