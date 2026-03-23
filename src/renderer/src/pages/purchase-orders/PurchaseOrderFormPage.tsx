// src/renderer/src/pages/purchase-orders/PurchaseOrderFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trash2, ArrowLeft } from 'lucide-react'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useProducts } from '../../hooks/useProducts'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type { CreatePOInput, POResult } from '@shared/types/purchase-order.types'

interface LineItem {
  productId: string
  sku: string
  name: string
  unit: string
  orderedQty: number
  unitCost: number
}

export default function PurchaseOrderFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const { create, update } = usePurchaseOrders()
  const { query: suppliersQuery } = useSuppliers()
  const { query: productsQuery } = useProducts()

  const suppliers = suppliersQuery.data?.data ?? []
  const allProducts = productsQuery.data?.data ?? []

  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: existingPO } = useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async () => {
      if (!id) return null
      const res = await ipc.invoke<POResult>(IPC.PO_GET_BY_ID, { id })
      return res.success ? res.data : null
    },
    enabled: Boolean(id)
  })

  useEffect(() => {
    if (existingPO && existingPO.status === 'draft') {
      setSupplierId(existingPO.supplierId)
      setNotes(existingPO.notes)
      setLineItems(existingPO.items.map(it => ({
        productId: it.productId, sku: it.sku, name: it.name, unit: it.unit,
        orderedQty: it.orderedQty, unitCost: it.unitCost
      })))
    }
  }, [existingPO])

  const items = lineItems
  const setItems = setLineItems

  const subtotal = items.reduce((s, it) => s + it.orderedQty * it.unitCost, 0)

  const filteredProducts = allProducts.filter(p =>
    p.isActive &&
    !items.find(it => it.productId === p._id) &&
    (p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.includes(productSearch))
  ).slice(0, 8)

  function addProduct(p: any) {
    setItems(prev => [...prev, {
      productId: p._id,
      sku: p.sku,
      name: p.name,
      unit: p.unit,
      orderedQty: 1,
      unitCost: p.costPrice ?? 0
    }])
    setProductSearch('')
  }

  function removeItem(productId: string) {
    setItems(prev => prev.filter(it => it.productId !== productId))
  }

  function updateItem(productId: string, field: 'orderedQty' | 'unitCost', value: number) {
    setItems(prev => prev.map(it => it.productId === productId ? { ...it, [field]: value } : it))
  }

  async function handleSave() {
    setError(null)
    if (!supplierId) { setError('Select a supplier'); return }
    if (items.length === 0) { setError('Add at least one product'); return }
    setSaving(true)
    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, input: { supplierId, notes, items: lineItems } })
      } else {
        const input: CreatePOInput = { supplierId, notes, items }
        await create.mutateAsync(input)
      }
      navigate('/purchase-orders')
    } catch (err: any) {
      setError(err.message ?? 'Failed to save PO')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>

      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/purchase-orders')}
            style={{
              width: '2rem', height: '2rem', borderRadius: '0.5rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', background: 'transparent',
              border: '1px solid var(--border-default)', cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {isEdit ? 'Update draft purchase order' : 'Create a new purchase order'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 space-y-5" style={{ maxWidth: '56rem' }}>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#dc2626' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Section: Order Details */}
        <div className="content-card">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem',
              background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Order Details</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Supplier and general information</p>
            </div>
          </div>

          <div style={{ padding: '1.25rem 1.5rem' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Supplier <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="dark-select"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Notes
                </label>
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="dark-input"
                  placeholder="Internal notes..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Line Items */}
        <div className="content-card">
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem',
                background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Line Items</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Products to order</p>
              </div>
            </div>
            {items.length > 0 && (
              <span className="badge-blue">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Product search */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: items.length > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div className="relative">
              <span style={{
                position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search by product name or SKU to add..."
                className="dark-input w-full"
                style={{ paddingLeft: '2.25rem' }}
              />
              {productSearch && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1.5 rounded-xl shadow-lg overflow-hidden"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                  {filteredProducts.map((p, idx) => (
                    <button
                      key={p._id}
                      onClick={() => addProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors"
                      style={{ color: 'var(--text-primary)', borderBottom: idx < filteredProducts.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center gap-2.5">
                        <div style={{
                          width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem',
                          background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{p.sku}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '3.5rem', height: '3.5rem', borderRadius: '1rem',
                background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-disabled)" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No items added yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Use the search above to find and add products</p>
            </div>
          )}

          {/* Line items table */}
          {items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--bg-base)' }}>
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Product</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>SKU</th>
                    <th className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Unit</th>
                    <th className="text-right px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Qty</th>
                    <th className="text-right px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Unit Cost</th>
                    <th className="text-right px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Total</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.productId} style={{ borderTop: idx === 0 ? '1px solid var(--border-subtle)' : '1px solid var(--border-subtle)' }}>
                      <td className="px-5 py-3">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                          {item.sku}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number" min={0.001} step={0.001}
                          value={item.orderedQty}
                          onChange={e => updateItem(item.productId, 'orderedQty', parseFloat(e.target.value) || 0)}
                          className="dark-input text-right"
                          style={{ width: '5.5rem' }}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <span style={{
                            position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-muted)', fontSize: '0.75rem', pointerEvents: 'none'
                          }}>₱</span>
                          <input
                            type="number" min={0} step={0.01}
                            value={item.unitCost}
                            onChange={e => updateItem(item.productId, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="dark-input text-right"
                            style={{ width: '6.5rem', paddingLeft: '1.5rem' }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          ₱{(item.orderedQty * item.unitCost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeItem(item.productId)}
                          style={{
                            width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)', background: 'transparent',
                            border: 'none', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
                    <td colSpan={5} className="px-5 py-3.5 text-right text-xs font-semibold" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Order Subtotal
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.625rem',
          padding: '1rem 1.25rem', borderRadius: '0.875rem',
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          {items.length > 0 && (
            <span className="text-xs mr-auto" style={{ color: 'var(--text-muted)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} &middot; ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
            </span>
          )}
          <button
            onClick={() => navigate('/purchase-orders')}
            className="btn-secondary flex items-center gap-2 px-5 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-5 py-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                Saving...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {isEdit ? 'Save Changes' : 'Save as Draft'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
