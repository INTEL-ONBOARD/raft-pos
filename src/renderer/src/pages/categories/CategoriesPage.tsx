import { useState, useMemo } from 'react'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  FolderOpenIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  XCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useCategories } from '../../hooks/useCategories'
import { useCategoryStore } from '../../stores/category.store'
import type { ICategory, CategoryTree } from '@shared/types/category.types'

/* ─── Stat Card ─────────────────────────────────────────────────────── */
interface StatCardProps { label: string; value: number | string; sub?: string; icon: React.ReactNode; accent: string; accentBg: string; highlight?: boolean; hlColor?: string; onClick?: () => void }
function StatCard({ label, value, sub, icon, accent, accentBg, highlight, hlColor, onClick }: StatCardProps) {
  const [hov, setHov] = useState(false)
  const active = highlight && Number(value) > 0
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)', border: `1px solid ${active ? (hlColor ?? accent) + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: '14px', padding: '18px 20px', cursor: onClick ? 'pointer' : 'default', transition: 'all 180ms ease', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-24px', right: '-16px', width: '80px', height: '80px', borderRadius: '50%', background: accentBg, filter: 'blur(28px)', pointerEvents: 'none', opacity: active ? 1 : 0.45 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: accent }}>{icon}</div>
        </div>
      </div>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: '0 0 4px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, margin: 0, lineHeight: 1, color: active ? (hlColor ?? accent) : '#fff' }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', margin: '5px 0 0' }}>{sub}</p>}
    </div>
  )
}

function gatherAllNodes(nodes: CategoryTree[]): CategoryTree[] {
  let res: CategoryTree[] = []
  for (const n of nodes) {
    res.push(n)
    res = res.concat(gatherAllNodes(n.children))
  }
  return res
}

function CategoryRow({
  node, depth, selectedId, hoveredId, setHoveredId, setSelectedId
}: {
  node: CategoryTree; depth: number; selectedId: string | null; hoveredId: string | null;
  setHoveredId: (id: string | null) => void; setSelectedId: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(true)
  const isSel = selectedId === node._id
  const isHov = hoveredId === node._id

  return (
    <>
      <div
        onClick={() => setSelectedId(node._id)}
        onMouseEnter={() => setHoveredId(node._id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          display: 'flex', alignItems: 'center', padding: '10px 14px',
          background: isSel ? 'rgba(99,102,241,0.07)' : isHov ? 'rgba(255,255,255,0.032)' : 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 110ms',
          borderLeft: isSel ? '2px solid rgba(99,102,241,0.60)' : '2px solid transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: depth * 24, flex: 1 }}>
          <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
            {node.children.length > 0 ? (
              <button onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }} style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.15s', background: 'none', border: 'none', cursor: 'pointer' }}>
                <ChevronDownIcon style={{ width: 14, height: 14, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
              </button>
            ) : <span style={{ width: 14 }} />}
          </div>
          <FolderIcon style={{ width: 16, color: node.isActive ? '#818cf8' : 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: 13, color: isSel ? '#818cf8' : 'rgba(255,255,255,0.85)', fontWeight: depth === 0 ? 600 : 500 }}>{node.name}</span>
        </div>
        
        <div style={{ width: '80px', textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: node.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: node.isActive ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
            {node.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-end' }}>
          <ChevronRightIcon style={{ width: '14px', color: isSel ? '#818cf8' : 'rgba(255,255,255,0.22)' }} />
        </div>
      </div>
      {open && node.children.map(child => (
        <CategoryRow key={child._id} node={child} depth={depth + 1}
          selectedId={selectedId} hoveredId={hoveredId} setHoveredId={setHoveredId} setSelectedId={setSelectedId} />
      ))}
    </>
  )
}

export default function CategoriesPage() {
  const { query, create, update, remove } = useCategories()
  const categories = useCategoryStore(s => s.categories)
  const getTree = useCategoryStore(s => s.getTree)
  const tree = useMemo(() => getTree(), [getTree])
  
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ name: '', parentId: '' })
  const [error, setError] = useState<string | null>(null)

  const allNodes = useMemo(() => gatherAllNodes(tree), [tree])
  const activeCount = categories.filter(c => c.isActive).length
  const inactiveCount = categories.filter(c => !c.isActive).length

  // Filter tree visually by searching flat list, if search exists
  const isSearching = search.trim().length > 0
  const flatFiltered = useMemo(() => {
    if (!isSearching) return []
    return categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  }, [categories, search, isSearching])

  const selectedNode = allNodes.find(n => n._id === selectedId) || null
  const isLoading = create.isPending || update.isPending

  async function handleSave() {
    setError(null)
    if (!form.name.trim()) { setError('Name is required'); return }
    try {
      if (isEditing && selectedNode) {
        await update.mutateAsync({ id: selectedNode._id, data: { name: form.name.trim(), parentId: form.parentId || null } })
      } else {
        await create.mutateAsync({ name: form.name.trim(), parentId: form.parentId || null })
      }
      setIsEditing(false)
      setForm({ name: '', parentId: '' })
      if (!isEditing) setSelectedId(null) // deselect to show global view
    } catch (err: any) { setError(err.message ?? 'Failed') }
  }

  async function handleDelete(catId: string) {
    if (!confirm('Delete this category?')) return
    try {
      await remove.mutateAsync(catId)
      setSelectedId(null)
    } catch (err: any) { alert(err.message ?? 'Failed to delete') }
  }

  function startCreate(parentId: string = '') {
    setSelectedId(null)
    setIsEditing(false)
    setForm({ name: '', parentId })
  }

  function startEdit(node: CategoryTree) {
    setIsEditing(true)
    setForm({ name: node.name, parentId: node.parentId ?? '' })
  }

  /* ── Right Panel ── */
  function RightPanel() {
    if (isEditing || (!selectedNode && form.name !== '' && !isEditing)) {
       // Form view
       return (
         <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '0 0 20px' }}>
               {isEditing ? 'Edit Category' : 'Create New Category'}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} autoFocus
                     style={{ width: '100%', height: '36px', padding: '0 12px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Parent Category</label>
                  <select value={form.parentId} onChange={e => setForm(f => ({...f, parentId: e.target.value}))}
                     style={{ width: '100%', height: '36px', padding: '0 12px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.8)', outline: 'none' }}>
                     <option value="">None (Top Level)</option>
                     {categories.filter(c => c._id !== selectedNode?._id && c.isActive).map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                     ))}
                  </select>
               </div>
               {error && <p style={{ fontSize: '12px', color: '#f87171', margin: 0 }}>{error}</p>}
               <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={handleSave} disabled={isLoading} style={{ flex: 1, padding: '10px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                     {isLoading ? 'Saving...' : 'Save Category'}
                  </button>
                  <button onClick={() => { setIsEditing(false); setForm({name:'', parentId:''}) }} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                     Cancel
                  </button>
               </div>
            </div>
         </div>
       )
    }

    if (!selectedNode) {
      /* Global View */
      return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' }}>
            <div style={{ padding: '0 20px' }}>
               <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Structure Overview</p>
               <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>Select a category to manage</p>
            </div>
            
            <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>Quick Actions</p>
               <button onClick={() => startCreate('')} style={{ width: '100%', padding: '12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', color: '#818cf8', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'background 150ms' }}>
                  <PlusIcon style={{ width: '16px' }} /> Create Top-Level Category
               </button>
            </div>

            <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Tree Details</p>
               {[
                  { label: 'Total Categories', value: categories.length, color: '#fff' },
                  { label: 'Active', value: activeCount, color: '#4ade80' },
                  { label: 'Inactive', value: inactiveCount, color: '#f87171' }
               ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                     <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                     <span style={{ fontSize: '13px', fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
               ))}
            </div>
         </div>
      )
    }

    /* Selected Details */
    return (
       <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
         <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button onClick={() => setSelectedId(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
               ← Global
            </button>
         </div>

         <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
            <div style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '14px', padding: '18px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                     <FolderOpenIcon style={{ width: '20px', height: '20px', color: '#818cf8' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                     <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedNode.name}</p>
                     <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{selectedNode.children.length} subcategories</p>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '6px' }}>
                  {selectedNode.isActive ? (
                     <span style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(34,197,94,0.2)' }}>Active</span>
                  ) : (
                     <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)' }}>Inactive</span>
                  )}
               </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Operations</p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => startCreate(selectedNode._id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                     <PlusIcon style={{ width: '16px' }} /> Add Subcategory Here
                  </button>
                  <button onClick={() => startEdit(selectedNode)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                     <PencilSquareIcon style={{ width: '16px' }} /> Edit Category Name
                  </button>
                  {selectedNode.children.length === 0 && (
                     <button onClick={() => handleDelete(selectedNode._id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                        <TrashIcon style={{ width: '16px' }} /> Delete Category
                     </button>
                  )}
               </div>
            </div>
         </div>
       </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(160deg,#0a0b14 0%,#080810 100%)', display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* LEFT PANEL */}
      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,rgba(99,102,241,0.22) 0%,rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpenIcon style={{ width: '18px', height: '18px', color: '#818cf8' }} />
            </div>
            <div>
               <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Categories</h1>
               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Hierarchy & Organization</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <StatCard label="Total Nodes" value={categories.length} icon={<FolderIcon style={{ width: 16 }} />} accent="#818cf8" accentBg="rgba(99,102,241,0.15)" />
            <StatCard label="Root Categories" value={tree.length} icon={<FolderOpenIcon style={{ width: 16 }} />} accent="#38bdf8" accentBg="rgba(56,189,248,0.12)" />
            <StatCard label="Active" value={activeCount} icon={<CheckCircleIcon style={{ width: 16 }} />} accent="#4ade80" accentBg="rgba(34,197,94,0.12)" />
            <StatCard label="Inactive" value={inactiveCount} icon={<XCircleIcon style={{ width: 16 }} />} accent="#f87171" accentBg="rgba(239,68,68,0.15)" />
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '20px 28px 0', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(255,255,255,0.32)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..."
              style={{ width: '100%', height: '36px', paddingLeft: '36px', paddingRight: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#fff', outline: 'none' }} />
          </div>
        </div>

        {/* Tree List */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '14px 28px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.065)', borderRadius: '16px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Header row */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
               <div style={{ flex: 1 }}>Name</div>
               <div style={{ width: '80px', textAlign: 'center' }}>Status</div>
               <div style={{ width: '40px' }} />
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
               {query.isLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
               ) : isSearching ? (
                  flatFiltered.length === 0 ? (
                     <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>No categories match your search.</div>
                  ) : (
                     flatFiltered.map(c => (
                        <div key={c._id} onClick={() => setSelectedId(c._id)} onMouseEnter={() => setHoveredId(c._id)} onMouseLeave={() => setHoveredId(null)}
                           style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', background: selectedId === c._id ? 'rgba(99,102,241,0.07)' : hoveredId === c._id ? 'rgba(255,255,255,0.03)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                           <div style={{ flex: 1, fontSize: '13px', color: '#fff' }}>{c.name}</div>
                           <div style={{ width: '80px', textAlign: 'center' }}><span style={{ fontSize: '10px', color: c.isActive ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>{c.isActive ? 'Active' : 'Inactive'}</span></div>
                           <div style={{ width: '40px' }} />
                        </div>
                     ))
                  )
               ) : tree.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '12px' }}>
                     <FolderOpenIcon style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.22)' }} />
                     <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>No categories found</p>
                  </div>
               ) : (
                  <div>
                     {tree.map(node => (
                        <CategoryRow key={node._id} node={node} depth={0} selectedId={selectedId} hoveredId={hoveredId} setHoveredId={setHoveredId} setSelectedId={setSelectedId} />
                     ))}
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', flexShrink: 0, position: 'relative', zIndex: 1 }} />

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, minWidth: '260px', maxWidth: '320px', overflowY: 'auto', position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.15)' }}>
        <RightPanel />
      </div>

    </div>
  )
}
