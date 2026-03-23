import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronRight, FolderOpen } from 'lucide-react'
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
      <tr>
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
            {node.children.length > 0 && (
              <button onClick={() => setOpen(v => !v)} style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
              </button>
            )}
            {node.children.length === 0 && <span className="w-4" />}
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{node.name}</span>
          </div>
        </td>
        <td className="py-2.5 px-4">
          {node.isActive ? <span className="badge-green">Active</span> : <span className="badge-gray">Inactive</span>}
        </td>
        <td className="py-2.5 px-4 text-right row-actions">
          <button onClick={() => onEdit(node)}
            className="mr-2 transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <Pencil className="w-4 h-4" />
          </button>
          {node.children.length === 0 && (
            <button onClick={() => onDelete(node)}
              className="transition-colors" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
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
  const categories = useCategoryStore(s => s.categories)
  const getTree = useCategoryStore(s => s.getTree)
  const tree = useMemo(() => getTree(), [categories])
  const [editing, setEditing] = useState<ICategory | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', parentId: '' })
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    if (!form.name.trim()) { setError('Name is required'); return }
    const payload = { name: form.name.trim(), parentId: form.parentId || null }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing._id, data: payload })
      } else {
        await create.mutateAsync(payload)
      }
      setEditing(null); setAdding(false); setForm({ name: '', parentId: '' })
    } catch (err: any) {
      setError(err.message ?? 'Failed')
    }
  }

  async function handleDelete(cat: ICategory) {
    if (!confirm(`Delete "${cat.name}"?`)) return
    try {
      await remove.mutateAsync(cat._id)
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete')
    }
  }

  function openEdit(cat: ICategory) {
    setEditing(cat)
    setForm({ name: cat.name, parentId: cat.parentId ?? '' })
    setAdding(true)
  }

  const isLoading = create.isPending || update.isPending

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(79,70,229,0.10)' }}>
            <FolderOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Categories</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Organize products into a hierarchy up to 3 levels deep</p>
          </div>
        </div>
        <button
          onClick={() => { setAdding(true); setEditing(null); setForm({ name: '', parentId: '' }) }}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>
      <div className="p-6 flex-1">

      {adding && (
        <div className="p-5 mb-6 rounded-xl" style={{ background: '#ffffff', border: '1px solid var(--border-default)', boxShadow: '0 1px 4px rgba(15,17,23,0.06)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{editing ? 'Edit Category' : 'New Category'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cat-name" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name *</label>
              <input
                id="cat-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="dark-input w-full px-3 py-2 text-sm"
                placeholder="e.g. Electrical"
              />
            </div>
            <div>
              <label htmlFor="cat-parent" className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Parent Category</label>
              <select
                id="cat-parent"
                value={form.parentId}
                onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                className="dark-select w-full px-3 py-2 text-sm"
              >
                <option value="">None (root)</option>
                {categories.filter(c => c._id !== editing?._id && c.isActive).map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p role="alert" className="text-sm mt-3" style={{ color: '#dc2626' }}>{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={isLoading}
              className="btn-primary flex items-center gap-2 disabled:opacity-60 px-4 py-2">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setAdding(false); setEditing(null); setError(null) }}
              className="btn-secondary flex items-center gap-2 px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="content-card overflow-hidden">
        {query.isLoading ? (
          <table className="dark-table">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 3 }).map((__, j) => (
                    <td key={j}>
                      <div className="h-4 rounded animate-pulse" style={{ background: 'var(--border-subtle)', width: j === 0 ? '120px' : j === 2 ? '60px' : '70px' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <FolderOpen className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="text-center">
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No categories yet</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Add one to get started.</p>
            </div>
          </div>
        ) : (
          <table className="dark-table">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Status</th>
                <th className="text-right">Actions</th>
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
    </div>
  )
}
