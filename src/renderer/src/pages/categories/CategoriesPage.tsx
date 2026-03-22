import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { useCategories } from '../../hooks/useCategories'
import { useCategoryStore } from '../../stores/category.store'
import type { ICategory, CategoryTree } from '@shared/types/category.types'

function CategoryRow({
  node, depth, onEdit, onDelete
}: {
  node: CategoryTree
  depth: number
  onEdit: (c: ICategory) => void
  onDelete: (c: ICategory) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
            {node.children.length > 0 && (
              <button onClick={() => setOpen(v => !v)} className="text-gray-400 hover:text-gray-600">
                <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
              </button>
            )}
            {node.children.length === 0 && <span className="w-4" />}
            <span className="text-sm text-gray-900">{node.name}</span>
          </div>
        </td>
        <td className="py-2.5 px-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${node.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {node.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="py-2.5 px-4 text-right">
          <button onClick={() => onEdit(node)} className="text-gray-400 hover:text-blue-600 mr-2">
            <Pencil className="w-4 h-4" />
          </button>
          {node.children.length === 0 && (
            <button onClick={() => onDelete(node)} className="text-gray-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </td>
      </tr>
      {open && node.children.map(child => (
        <CategoryRow key={child._id} node={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  )
}

export default function CategoriesPage() {
  const { query, create, update, remove } = useCategories()
  const tree = useCategoryStore(s => s.getTree())
  const categories = useCategoryStore(s => s.categories)
  const [editing, setEditing] = useState<ICategory | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', parentId: '' })
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    if (!form.name.trim()) { setError('Name is required'); return }
    const payload = { name: form.name.trim(), parentId: form.parentId || null }
    const res = editing
      ? await update.mutateAsync({ id: editing._id, data: payload })
      : await create.mutateAsync(payload)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    setEditing(null); setAdding(false); setForm({ name: '', parentId: '' })
  }

  async function handleDelete(cat: ICategory) {
    if (!confirm(`Delete "${cat.name}"?`)) return
    const res = await remove.mutateAsync(cat._id)
    if (!res.success) alert(res.error ?? 'Failed to delete')
  }

  function openEdit(cat: ICategory) {
    setEditing(cat)
    setForm({ name: cat.name, parentId: cat.parentId ?? '' })
    setAdding(true)
  }

  const isLoading = create.isPending || update.isPending

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Organize products into a hierarchy up to 3 levels deep</p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditing(null); setForm({ name: '', parentId: '' }) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editing ? 'Edit Category' : 'New Category'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cat-name" className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                id="cat-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Electrical"
              />
            </div>
            <div>
              <label htmlFor="cat-parent" className="block text-xs font-medium text-gray-600 mb-1">Parent Category</label>
              <select
                id="cat-parent"
                value={form.parentId}
                onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (root)</option>
                {categories.filter(c => c._id !== editing?._id && c.isActive).map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p role="alert" className="text-red-600 text-sm mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setAdding(false); setEditing(null); setError(null) }}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {query.isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading categories...</div>
        ) : tree.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No categories yet. Add one to get started.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tree.map(node => (
                <CategoryRow key={node._id} node={node} depth={0} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
