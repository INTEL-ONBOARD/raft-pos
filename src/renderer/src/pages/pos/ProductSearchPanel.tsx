// src/renderer/src/pages/pos/ProductSearchPanel.tsx
import { useState } from 'react'
import { Search, Scan, ShoppingBag } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { usePosStore } from '../../stores/pos.store'
import { useInventory } from '../../hooks/useInventory'

export function ProductSearchPanel() {
  const [search, setSearch] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const { query: productsQuery } = useProducts({
    search: search || undefined,
    categoryId: activeCategoryId ?? undefined,
    isActive: true
  })
  const { query: categoriesQuery } = useCategories()
  const { stockQuery } = useInventory()
  const addItem = usePosStore((s) => s.addItem)

  const products = productsQuery.data?.data ?? []
  const categories = categoriesQuery.data ?? []
  const stockMap = new Map(
    (stockQuery.data ?? []).map((s: any) => [s.productId, s.quantity])
  )

  function handleAddProduct(product: any) {
    const availableStock = stockMap.get(product._id) ?? 0
    addItem({
      productId: product._id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      quantity: 1,
      unitPrice: product.sellingPrice,
      unitCost: product.costPrice ?? 0,
      availableStock
    })
  }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      {/* Page header */}
      <div className="sticky top-0 z-10 px-6 py-4" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: 'rgba(79,70,229,0.10)' }}>
              <ShoppingBag className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Point of Sale</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {productsQuery.isLoading
                  ? 'Loading products…'
                  : `${products.length} product${products.length !== 1 ? 's' : ''} shown`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 p-5">
        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              id="pos-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product or SKU..."
              className="dark-input w-full pl-9"
              style={{ height: '40px', borderRadius: '10px', boxShadow: 'var(--shadow-xs)' }}
              inputMode="search"
              autoFocus
            />
          </div>
          <div
            title="USB HID barcode scanner active when connected"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)'
            }}
          >
            <Scan className="w-3.5 h-3.5" />
            Scan
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setActiveCategoryId(null)}
            className="transition-all"
            style={{
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 500,
              height: '28px',
              padding: '0 12px',
              ...(activeCategoryId === null
                ? { background: 'var(--accent)', color: '#ffffff', border: 'none' }
                : { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }
              )
            }}
          >
            All
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategoryId(cat._id)}
              className="transition-all"
              style={{
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 500,
                height: '28px',
                padding: '0 12px',
                ...(activeCategoryId === cat._id
                  ? { background: 'var(--accent)', color: '#ffffff', border: 'none' }
                  : { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }
                )
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl" style={{ height: '120px' }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <ShoppingBag className="w-6 h-6" style={{ color: 'var(--text-disabled)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No products found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try a different search or category.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product: any) => {
              const stock = stockMap.get(product._id) ?? 0
              const outOfStock = stock <= 0
              return (
                <button
                  key={product._id}
                  onClick={() => !outOfStock && handleAddProduct(product)}
                  disabled={outOfStock}
                  className={`text-left transition-all rounded-xl p-3.5 ${outOfStock ? 'opacity-45 cursor-not-allowed' : 'active:scale-[0.97] cursor-pointer'}`}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    outline: 'none',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                  onMouseEnter={(e) => {
                    if (!outOfStock) {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = 'rgba(79,70,229,0.3)'
                      el.style.boxShadow = 'var(--shadow-sm)'
                      el.style.background = '#f8f9ff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!outOfStock) {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = 'var(--border-subtle)'
                      el.style.boxShadow = 'var(--shadow-xs)'
                      el.style.background = '#ffffff'
                    }
                  }}
                >
                  {/* SKU + stock dot */}
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>{product.sku}</p>
                    <span
                      className="w-2 h-2 rounded-full shrink-0 ml-2"
                      style={{
                        background: outOfStock ? 'var(--color-danger)' : 'var(--color-success)',
                        boxShadow: outOfStock ? '0 0 5px rgba(220,38,38,0.35)' : '0 0 5px rgba(22,163,74,0.35)'
                      }}
                    />
                  </div>
                  <p className="text-sm font-semibold mt-0.5 line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {product.name}
                  </p>
                  <p className="font-bold mt-2" style={{ fontSize: '18px', color: 'var(--accent)' }}>
                    &#8369;{product.sellingPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: outOfStock ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    {outOfStock ? 'Out of stock' : `${stock} ${product.unit} in stock`}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
