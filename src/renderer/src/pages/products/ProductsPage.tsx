import { useState, useMemo } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  QrCodeIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  NoSymbolIcon,
  TagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  FunnelIcon,
  ChevronRightIcon,
  XCircleIcon,
  ArchiveBoxIcon
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

/* ─── Shared UI Helpers ────────────────────────────────────────────── */

function marginPct(cost: number, price: number) {
  if (!price || price <= 0) return 0
  return Math.round(((price - cost) / price) * 100)
}

function marginColor(pct: number) {
  if (pct >= 40) return { text: '#4ade80', bg: 'rgba(34,197,94,0.1)' } // Green
  if (pct >= 20) return { text: '#38bdf8', bg: 'rgba(56,189,248,0.1)' } // Blue
  if (pct > 0)   return { text: '#fbbf24', bg: 'rgba(245,158,11,0.1)' } // Amber
  return         { text: '#f87171', bg: 'rgba(239,68,68,0.1)' } // Red (loss / 0)
}

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

/* ─── Main Component ────────────────────────────────────────────────── */
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
  
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<IProduct | null>(null)
  
  type SortKey = 'name' | 'sku' | 'costPrice' | 'sellingPrice'
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const queryClient = useQueryClient()
  const { query, create, update, deactivate } = useProducts({ search: search || undefined, categoryId: categoryId || undefined, isActive: showInactive ? undefined : true })
  useCategories()
  
  const allCategories = useCategoryStore((s) => s.categories)
  const categories = useMemo(() => allCategories.filter(c => c.isActive), [allCategories])

  const products = query.data?.data ?? []
  const totalDisplay = query.data?.total ?? 0
  
  // Local filtering & sorting (since query also filters, this just refines memory arrays)
  const filtered = useMemo(() => {
    let list = [...products]
    return list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [products, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  async function handleSave(input: CreateProductInput) {
    setFormError(null)
    if (!input.sku.trim() || !input.name.trim()) { setFormError('SKU and Name are required'); return }
    const res = editProduct ? await update.mutateAsync({ id: editProduct._id, input }) : await create.mutateAsync(input)
    if (!res.success) { setFormError(res.error ?? 'Failed'); return }
    setShowForm(false)
    setEditProduct(null)
    if (selectedRow && selectedRow._id === editProduct?._id) setSelectedRow(null)
  }

  function parseCsvLine(line: string): string[] {
    const result: string[] = []; let cur = ''; let inQuotes = false
    for (let i = 0; i < line.length; i++) {
       const ch = line[i]
       if (ch === '"') { if (inQuotes && line[i+1] === '"') { cur += '"'; i++ } else inQuotes = !inQuotes }
       else if (ch === ',' && !inQuotes) { result.push(cur.trim()); cur = '' }
       else { cur += ch }
    }
    result.push(cur.trim())
    return result
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase())
      const rows = lines.slice(1).map(line => Object.fromEntries(headers.map((h, i) => [h, parseCsvLine(line)[i] ?? ''])))
      const res = await ipc.invoke<{ success: boolean; data?: any; error?: string }>(IPC.PRODUCTS_IMPORT_CSV, { rows })
      if (res.success) { setImportResult(res.data); queryClient.invalidateQueries({ queryKey: ['products'] }) }
      else alert(res.error ?? 'Import failed')
    } finally { setImporting(false); e.target.value = '' }
  }

  /* ── Right panel setup ── */
  const liveSelected = selectedRow ? (products.find(r => r._id === selectedRow._id) ?? selectedRow) : null
  
  // Analytics
  const activeCount = products.filter(p => p.isActive).length
  const inactiveCount = products.filter(p => !p.isActive).length
  const avgMargin = products.length > 0 ? products.reduce((acc, p) => acc + marginPct(p.costPrice, p.sellingPrice), 0) / products.length : 0

  function TH({ children, col, align = 'left' }: { children: React.ReactNode; col?: SortKey; align?: 'left' | 'right' | 'center' }) {
    const active = col && sortKey === col
    return (
      <th onClick={col ? () => toggleSort(col) : undefined}
        style={{ background: 'rgba(255,255,255,0.02)', color: active ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 14px', textAlign: align, borderBottom: '1px solid rgba(255,255,255,0.055)', cursor: col ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', transition: 'color 140ms' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {children}
        </span>
      </th>
    )
  }

  function RightPanel() {
    if (!liveSelected) {
      /* Global Analytics */
      return (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '20px 20px 0' }}>
               <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Catalog Overview</p>
               <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>Select a product for operations</p>
            </div>

            <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>Quick Actions</p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => { setShowForm(true); setEditProduct(null); setFormError(null) }} style={{ padding: '12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', color: '#818cf8', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'background 150ms' }}>
                     <PlusIcon style={{ width: '16px' }} /> Create New Product
                  </button>
                  <label style={{ padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'background 150ms' }}>
                     <ArrowDownTrayIcon style={{ width: '16px' }} />
                     {importing ? 'Importing CSV...' : 'Import Catalog via CSV'}
                     <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} disabled={importing} />
                  </label>
               </div>
            </div>

            <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }}>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Catalog Summary</p>
               {[
                  { label: 'Active Items', value: activeCount, color: '#4ade80' },
                  { label: 'Inactive Items', value: inactiveCount, color: '#f87171' },
                  { label: 'Categories in Use', value: new Set(products.map(p => p.categoryId)).size, color: '#fff' }
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
    const p = liveSelected
    const cat = categories.find(c => c._id === p.categoryId)
    const mPct = marginPct(p.costPrice, p.sellingPrice)
    const mCol = marginColor(mPct)

    return (
       <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
         <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button onClick={() => setSelectedRow(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '7px', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
               ← Catalog
            </button>
         </div>

         <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>

            <div style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '14px', padding: '18px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                     <ArchiveBoxIcon style={{ width: '20px', height: '20px', color: '#818cf8' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                     <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                     <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', fontFamily: 'monospace' }}>
                        {p.sku} {p.barcode ? `· ${p.barcode}` : ''}
                     </p>
                  </div>
               </div>

               <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                  <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                     {cat?.name ?? 'Uncategorized'}
                  </span>
                  <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                     {p.unit}
                  </span>
                  {p.isActive ? (
                     <span style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(34,197,94,0.2)' }}>Active</span>
                  ) : (
                     <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)' }}>Inactive</span>
                  )}
               </div>

            </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
               {[
                  { label: 'Selling Price', value: `₱${p.sellingPrice.toFixed(2)}`, bg: 'rgba(34,197,94,0.1)', color: '#4ade80', icon: <TagIcon style={{ width: 14 }}/> },
                  { label: 'Cost Price', value: `₱${p.costPrice.toFixed(2)}`, bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', icon: <CurrencyDollarIcon style={{ width: 14 }}/> }
               ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '13px' }}>
                     <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', color: m.color }}>{m.icon}</div>
                     <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: '0 0 3px' }}>{m.label}</p>
                     <p style={{ fontSize: '18px', fontWeight: 700, color: m.color, margin: 0, lineHeight: 1 }}>{m.value}</p>
                  </div>
               ))}
               <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                     <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: '0 0 3px' }}>Estimated Margin</p>
                     <p style={{ fontSize: '18px', fontWeight: 700, color: mCol.text, margin: 0, lineHeight: 1 }}>{mPct}%</p>
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: '6px', background: mCol.bg, color: mCol.text, fontWeight: 600, fontSize: '11px' }}>
                     ₱{(p.sellingPrice - p.costPrice).toFixed(2)} profit
                  </div>
               </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
               <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>Operations</p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => setBarcodeProduct(p)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 150ms' }}>
                     <QrCodeIcon style={{ width: '16px' }} /> View Product Barcode
                  </button>
                  <button onClick={() => { setEditProduct(p); setShowForm(true); setFormError(null) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 150ms' }}>
                     <PencilSquareIcon style={{ width: '16px' }} /> Edit Product Info
                  </button>
                  {p.isActive && (
                     <button onClick={() => { if(confirm('Disable this product?')) deactivate.mutate(p._id) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 150ms', marginTop: '4px' }}>
                        <NoSymbolIcon style={{ width: '16px' }} /> Deactivate Product
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
              <CubeIcon style={{ width: '18px', height: '18px', color: '#818cf8' }} />
            </div>
            <div>
               <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Products</h1>
               <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Catalog database</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <StatCard label="Total Products" value={totalDisplay} icon={<CubeIcon style={{ width: 16 }} />} accent="#818cf8" accentBg="rgba(99,102,241,0.15)" />
            <StatCard label="Active Items" value={products.filter(p=>p.isActive).length} icon={<CheckCircleIcon style={{ width: 16 }} />} accent="#4ade80" accentBg="rgba(34,197,94,0.12)" />
            <StatCard label="Avg. Margin" value={`${Math.round(avgMargin)}%`} icon={<ChartBarIcon style={{ width: 16 }} />} accent="#38bdf8" accentBg="rgba(56,189,248,0.12)" />
            <StatCard label="Categories" value={categories.length} icon={<TagIcon style={{ width: 16 }} />} accent="#a855f7" accentBg="rgba(168,85,247,0.15)" />
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '20px 28px 0', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(255,255,255,0.32)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or SKU…"
              style={{ width: '100%', height: '36px', paddingLeft: '36px', paddingRight: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#fff', outline: 'none' }} />
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: 'rgba(255,255,255,0.8)', padding: '0 12px', height: '36px', fontSize: '13px', outline: 'none' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowInactive(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 150ms', background: showInactive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', border: showInactive ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)', color: showInactive ? '#fff' : 'rgba(255,255,255,0.50)' }}>
            <FunnelIcon style={{ width: '13px', height: '13px' }} /> Show Inactive
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '14px 28px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.065)', borderRadius: '16px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowY: 'auto', flex: 1 }}>
               {filtered.length === 0 && !query.isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '12px' }}>
                     <CubeIcon style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.22)' }} />
                     <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>No products found</p>
                  </div>
               ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                        <tr>
                           <TH col="sku">SKU</TH>
                           <TH col="name">Product</TH>
                           <TH>Category</TH>
                           <TH col="costPrice">Cost</TH>
                           <TH col="sellingPrice">Price</TH>
                           <TH>Margin</TH>
                           <TH align="center">Status</TH>
                           <TH></TH>
                        </tr>
                     </thead>
                     <tbody>
                        {query.isLoading ? (
                           <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading...</td></tr>
                        ) : filtered.map((row, idx) => {
                           const cat = categories.find(c => c._id === row.categoryId)
                           const isSel = selectedRow?._id === row._id
                           const isHov = hoveredRow === row._id
                           const bd = idx === filtered.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.042)'
                           const mPct = marginPct(row.costPrice, row.sellingPrice)
                           const mCol = marginColor(mPct)

                           return (
                              <tr key={row._id}
                                 onClick={() => setSelectedRow(isSel ? null : row)}
                                 onMouseEnter={() => setHoveredRow(row._id)}
                                 onMouseLeave={() => setHoveredRow(null)}
                                 style={{ background: isSel ? 'rgba(99,102,241,0.07)' : isHov ? 'rgba(255,255,255,0.032)' : 'transparent', cursor: 'pointer', transition: 'background 110ms', borderLeft: isSel ? '2px solid rgba(99,102,241,0.60)' : '2px solid transparent' }}>
                                 
                                 <td style={{ padding: '13px 14px', borderBottom: bd }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.42)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px', padding: '2px 7px' }}>{row.sku}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                       <span style={{ fontSize: '13px', fontWeight: 600, color: isSel ? '#818cf8' : 'rgba(255,255,255,0.88)' }}>{row.name}</span>
                                       <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{row.unit}</span>
                                    </div>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{cat?.name ?? '—'}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>₱{row.costPrice.toFixed(2)}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>₱{row.sellingPrice.toFixed(2)}</span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: mCol.text, background: mCol.bg, padding: '2px 6px', borderRadius: '5px' }}>
                                       {mPct}%
                                    </span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'center' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: row.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: row.isActive ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                                       <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                                       {row.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                 </td>
                                 <td style={{ padding: '13px 14px', borderBottom: bd, textAlign: 'right' }}>
                                    <ChevronRightIcon style={{ width: '14px', height: '14px', color: isSel ? '#818cf8' : 'rgba(255,255,255,0.22)', transition: 'color 120ms', transform: isSel ? 'rotate(90deg)' : 'none' }} />
                                 </td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
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

       {/* Modals */}
       {showForm && (
          <ProductFormModal
             product={editProduct}
             onSave={handleSave}
             onClose={() => {
                setShowForm(false)
                setEditProduct(null)
             }}
             loading={create.isPending || update.isPending}
             error={formError}
             clearError={() => setFormError(null)}
          />
       )}
       {barcodeProduct && <BarcodeModal product={barcodeProduct} onClose={() => setBarcodeProduct(null)} />}
       {importResult && (
          <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
             <div className="rounded-xl shadow-xl w-full max-w-lg p-6 modal-panel" style={{ background: '#1c1c24', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 className="text-base font-semibold mb-3">Import Complete</h3>
                <p className="text-sm mb-4">
                   <span style={{ color: '#4ade80' }}>{importResult.imported} products imported</span>
                   {importResult.errors.length > 0 && <span className="ml-2" style={{ color: '#f87171' }}>· {importResult.errors.length} errors</span>}
                </p>
                {importResult.errors.length > 0 && (
                   <div className="max-h-48 overflow-y-auto rounded-lg p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {importResult.errors.map((e, i) => <p key={i}>Row {e.row} ({e.sku}): {e.error}</p>)}
                   </div>
                )}
                <button onClick={() => setImportResult(null)} style={{ background: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '16px' }}>Done</button>
             </div>
          </div>
       )}
    </div>
  )
}
