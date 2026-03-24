import { useState, useMemo } from 'react'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline'
import { useCategories } from '../../hooks/useCategories'
import { useCategoryStore } from '../../stores/category.store'
import type { ICategory, CategoryTree } from '@shared/types/category.types'

// ── Shared inline style tokens ──────────────────────────────────────────────
const tableContainerStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  overflow: 'hidden',
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
  whiteSpace: 'nowrap',
}

const thRightStyle: React.CSSProperties = { ...thStyle, textAlign: 'right' }

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  verticalAlign: 'middle',
}

function CategoryRow({
  node, depth, onEdit, onDelete
}: {
  node: CategoryTree
  depth: number
  onEdit: (c: ICategory) => void
  onDelete: (c: ICategory) => void
}) {
  const [open, setOpen] = useState(true)
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <tr
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent' }}
      >
        <td style={tdStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: depth * 24 }}>
            {node.children.length > 0 ? (
              <button
                onClick={() => setOpen(v => !v)}
                style={{ color: 'rgba(255,255,255,0.30)', transition: 'color 0.15s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.70)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}
              >
                <ChevronDownIcon style={{
                  width: 14, height: 14,
                  transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.15s',
                }} />
              </button>
            ) : (
              <span style={{ width: 14, display: 'inline-block' }} />
            )}
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: depth === 0 ? 500 : 400 }}>
              {node.name}
            </span>
          </div>
        </td>
        <td style={tdStyle}>
          {node.isActive ? <span className="badge-green">Active</span> : <span className="badge-gray">Inactive</span>}
        </td>
        <td style={{ ...tdStyle, textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <button
              onClick={() => onEdit(node)}
              style={{ color: 'rgba(255,255,255,0.30)', padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}
              title="Edit category"
              aria-label={`Edit ${node.name}`}
            >
              <PencilSquareIcon style={{ width: 16, height: 16 }} />
            </button>
            {node.children.length === 0 && (
              <button
                onClick={() => onDelete(node)}
                style={{ color: 'rgba(255,255,255,0.30)', padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.30)')}
                title="Delete category"
                aria-label={`Delete ${node.name}`}
              >
                <TrashIcon style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      background: '#080810',
      position: 'relative',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 900px 600px at 20% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 36px 20px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(99,102,241,0.12)',
            flexShrink: 0,
          }}>
            <FolderOpenIcon style={{ width: 18, height: 18, color: '#818cf8' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.2 }}>Categories</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
              Organize products into a hierarchy up to 3 levels deep
            </p>
          </div>
        </div>
        <button
          onClick={() => { setAdding(true); setEditing(null); setForm({ name: '', parentId: '' }) }}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <PlusIcon style={{ width: 16, height: 16 }} /> Add Category
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '0 36px 36px', flex: 1, position: 'relative', zIndex: 1 }}>

        {/* Inline add/edit form */}
        {adding && (
          <div style={{
            padding: 20,
            marginBottom: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
              {editing ? 'Edit Category' : 'New Category'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label
                  htmlFor="cat-name"
                  style={{
                    display: 'block', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.10em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.22)', marginBottom: 6,
                  }}
                >
                  Name *
                </label>
                <input
                  id="cat-name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="dark-input w-full px-3 py-2 text-sm"
                  placeholder="e.g. Electrical"
                />
              </div>
              <div>
                <label
                  htmlFor="cat-parent"
                  style={{
                    display: 'block', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.10em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.22)', marginBottom: 6,
                  }}
                >
                  Parent Category
                </label>
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
            {error && <p role="alert" style={{ fontSize: 13, color: '#dc2626', marginTop: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-60 px-4 py-2"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { setAdding(false); setEditing(null); setError(null) }}
                className="btn-secondary flex items-center gap-2 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={tableContainerStyle}>
          {query.isLoading ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Status</th>
                  <th style={thRightStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 3 }).map((__, j) => (
                      <td key={j} style={tdStyle}>
                        <div className="animate-pulse" style={{
                          height: 14, borderRadius: 6,
                          background: 'rgba(255,255,255,0.06)',
                          width: j === 0 ? 120 : j === 2 ? 60 : 70,
                        }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tree.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '64px 0', gap: 12,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FolderOpenIcon style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.25)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>No categories yet</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>Add one to get started.</p>
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Status</th>
                  <th style={thRightStyle}>Actions</th>
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
