import { useState } from 'react'
import { Plus, Search, Pencil, PowerOff } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useCategoryStore } from '../../stores/category.store'
import { ProductFormModal } from './ProductFormModal'
import type { IProduct, CreateProductInput } from '@shared/types/product.types'

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [editProduct, setEditProduct] = useState<IProduct | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { query, create, update, deactivate } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    isActive: showInactive ? undefined : true
  })
  useCategories()
  const categories = useCategoryStore(s => s.categories.filter(c => c.isActive))

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

  const products = query.data?.data ?? []
  const total = query.data?.total ?? 0
  const isLoading = create.isPending || update.isPending

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{total} product{total !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditProduct(null); setFormError(null) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)}
            className="rounded" />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {query.isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No products found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['SKU', 'Name', 'Category', 'Unit', 'Cost', 'Price', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const cat = categories.find(c => c._id === p.categoryId)
                return (
                  <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-700">{p.sku}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{cat?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{p.unit}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">₱{p.costPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">₱{p.sellingPrice.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => { setEditProduct(p); setShowForm(true); setFormError(null) }}
                        className="text-gray-400 hover:text-blue-600 mr-2"><Pencil className="w-4 h-4" /></button>
                      {p.isActive && (
                        <button onClick={() => { if (confirm('Deactivate this product?')) deactivate.mutate(p._id) }}
                          className="text-gray-400 hover:text-red-600"><PowerOff className="w-4 h-4" /></button>
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
    </div>
  )
}
