// src/renderer/src/pages/pos/CartPanel.tsx
import { useState } from 'react'
import { Trash2, Plus, Minus, Tag, ArrowRight, X } from 'lucide-react'
import { usePosStore, selectSubtotal, selectOrderDiscountAmount, selectTaxAmount, selectTotalAmount, selectTotalPaid } from '../../stores/pos.store'
import { useCartTotals, usePOS } from '../../hooks/usePOS'
import { useAuthStore } from '../../stores/auth.store'
import { PaymentModal } from './PaymentModal'
import { SupervisorPinModal } from './SupervisorPinModal'
import type { ITransaction, DiscountType } from '@shared/types/transaction.types'

// Suppress unused import warnings — these selectors are exported from pos.store
// and imported here to keep the dependency chain explicit for tree-shaking.
void selectSubtotal
void selectOrderDiscountAmount
void selectTaxAmount
void selectTotalAmount
void selectTotalPaid

interface CartPanelProps {
  onSaleComplete: (txn: ITransaction) => void
}

// Tax rate default — Phase 7 settings page will write this to electron-store.
// For Phase 4, default to 0 (no tax) to avoid breaking builds.
const DEFAULT_TAX_RATE = 0

export function CartPanel({ onSaleComplete }: CartPanelProps) {
  const items = usePosStore((s) => s.items)
  const orderDiscount = usePosStore((s) => s.orderDiscount)
  const payments = usePosStore((s) => s.payments)
  const { updateQty, removeItem, setItemDiscount, setOrderDiscount, clearOrderDiscount, removePayment, clearCart } = usePosStore()

  const totals = useCartTotals(DEFAULT_TAX_RATE)
  const { completeSaleMutation, validateSupervisorPin, maxDiscountPercent, requiresSupervisorOverride } = usePOS()
  const role = useAuthStore((s) => s.role)
  const canApplyDiscount = role?.permissions?.includes('can_apply_discount') ?? false
  const canApplyOrderDiscount = role?.permissions?.includes('can_apply_order_discount') ?? false

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingDiscount, setPendingDiscount] = useState<{ productId: string | null; amount: number; type: DiscountType } | null>(null)
  const [showSupervisorModal, setShowSupervisorModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canPay =
    items.length > 0 &&
    payments.length > 0 &&
    totals.totalPaid >= totals.totalAmount

  async function handlePay() {
    if (!canPay) return
    setError(null)

    const input = {
      items: items.map((it) => ({
        productId: it.productId,
        sku: it.sku,
        name: it.name,
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unitCost: it.unitCost,
        discountAmount: it.discountAmount,
        discountType: it.discountType
      })),
      subtotal: totals.subtotal,
      discountAmount: orderDiscount?.amount ?? 0,
      discountType: (orderDiscount?.type ?? 'fixed') as DiscountType,
      taxRate: DEFAULT_TAX_RATE,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference || null
      })),
      // Phase 7 settings will populate branchCode properly via electron-store.
      // For now, default to 'BR' as a safe fallback.
      branchCode: 'BR'
    }

    try {
      const result = await completeSaleMutation.mutateAsync(input)
      onSaleComplete(result.data)
    } catch (err: any) {
      setError(err.message ?? 'Failed to complete sale')
    }
  }

  function handleItemDiscountChange(productId: string, amount: number, type: DiscountType) {
    const item = items.find((i) => i.productId === productId)
    if (!item) return

    const cap = maxDiscountPercent
    const exceeds =
      type === 'percent'
        ? amount > cap
        : (item.unitPrice * item.quantity) > 0
          ? (amount / (item.unitPrice * item.quantity)) * 100 > cap
          : false

    if (exceeds && requiresSupervisorOverride) {
      setPendingDiscount({ productId, amount, type })
      setShowSupervisorModal(true)
    } else {
      let capped: number
      if (type === 'percent') {
        capped = Math.min(amount, maxDiscountPercent)
      } else {
        const itemBase = item.unitPrice * item.quantity
        const maxFixed = (itemBase * maxDiscountPercent) / 100
        capped = Math.min(amount, maxFixed)
      }
      setItemDiscount(productId, capped, type)
    }
  }

  async function handleSupervisorApproved() {
    if (!pendingDiscount) return
    if (pendingDiscount.productId) {
      setItemDiscount(pendingDiscount.productId, pendingDiscount.amount, pendingDiscount.type)
    } else {
      setOrderDiscount(pendingDiscount.amount, pendingDiscount.type)
    }
    setPendingDiscount(null)
    setShowSupervisorModal(false)
  }

  function handleOrderDiscountChange(value: string, type: DiscountType) {
    const amount = parseFloat(value) || 0
    const orderBase = totals.subtotal
    const percentEquiv = type === 'percent' ? amount : (orderBase > 0 ? (amount / orderBase) * 100 : 0)

    if (percentEquiv > maxDiscountPercent && requiresSupervisorOverride) {
      setPendingDiscount({ productId: null, amount, type })
      setShowSupervisorModal(true)
      return
    }

    const cappedAmount = type === 'percent'
      ? Math.min(amount, maxDiscountPercent)
      : Math.min(amount, (orderBase * maxDiscountPercent) / 100)
    setOrderDiscount(cappedAmount, type)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Cart</h2>
          {items.length > 0 && (
            <span className="badge-blue">{items.length}</span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            title="Clear cart"
            aria-label="Clear cart"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12 gap-2">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Add products to start a sale</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="rounded-xl p-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              >
                {/* Top row: name + remove button */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }} className="line-clamp-2 flex-1">
                    {item.name}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="shrink-0 p-0.5 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  &#8369;{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / {item.unit}
                </p>

                {/* Qty stepper + line total */}
                <div className="flex items-center justify-between mt-2">
                  {/* Pill qty stepper */}
                  <div
                    className="flex items-center"
                    style={{ border: '1px solid var(--border-default)', borderRadius: '999px', height: '28px', overflow: 'hidden' }}
                  >
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="flex items-center justify-center transition-colors"
                      style={{ width: '28px', height: '28px', color: 'var(--text-secondary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '24px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="flex items-center justify-center transition-colors"
                      style={{ width: '28px', height: '28px', color: 'var(--text-secondary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    &#8369;{(item.unitPrice * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Stock warning */}
                {item.quantity > item.availableStock && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>
                    Warning: only {item.availableStock} in stock
                  </p>
                )}

                {/* Per-item discount */}
                {canApplyDiscount && (
                  <div className="flex items-center gap-2 mt-2">
                    <Tag className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={item.discountType}
                      onChange={(e) =>
                        handleItemDiscountChange(item.productId, item.discountAmount, e.target.value as DiscountType)
                      }
                      className="dark-select text-xs py-0.5 px-1"
                    >
                      <option value="fixed">&#8369; off</option>
                      <option value="percent">% off</option>
                    </select>
                    <input
                      type="number"
                      value={item.discountAmount || ''}
                      min={0}
                      placeholder="0"
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0
                        handleItemDiscountChange(item.productId, v, item.discountType)
                      }}
                      className="dark-input w-16 text-xs py-0.5 px-2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals + payment area */}
      <div className="px-4 py-3 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {/* Order-level discount */}
        {canApplyOrderDiscount && (
          <div className="flex items-center gap-2">
            <span className="text-xs w-24 shrink-0" style={{ color: 'var(--text-muted)' }}>Order discount</span>
            <select
              value={orderDiscount?.type ?? 'fixed'}
              onChange={(e) =>
                handleOrderDiscountChange(String(orderDiscount?.amount ?? 0), e.target.value as DiscountType)
              }
              className="dark-select text-xs py-0.5 px-1"
            >
              <option value="fixed">&#8369; off</option>
              <option value="percent">% off</option>
            </select>
            <input
              type="number"
              value={orderDiscount?.amount || ''}
              min={0}
              placeholder="0"
              onChange={(e) => {
                handleOrderDiscountChange(e.target.value, orderDiscount?.type ?? 'fixed')
              }}
              className="dark-input w-20 text-xs py-0.5 px-2"
            />
            {orderDiscount && (
              <button onClick={clearOrderDiscount} className="text-xs" style={{ color: 'var(--color-danger)' }}>
                Remove
              </button>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
            <span>Subtotal</span>
            <span>&#8369;{totals.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
          {totals.orderDiscountAmount > 0 && (
            <div className="flex justify-between" style={{ color: 'var(--color-success)' }}>
              <span>Discount</span>
              <span>-&#8369;{totals.orderDiscountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
              <span>Tax ({DEFAULT_TAX_RATE}%)</span>
              <span>&#8369;{totals.taxAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-2" style={{ color: 'var(--text-primary)', borderTop: '2px solid var(--border-default)', marginTop: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: '24px', fontWeight: 800 }}>&#8369;{totals.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="space-y-1">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="capitalize">{p.method}</span>
              <div className="flex items-center gap-2">
                <span>&#8369;{p.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                <button
                  onClick={() => removePayment(p.id)}
                  style={{ color: 'var(--color-danger)' }}
                  aria-label="Remove payment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full text-xs font-medium py-1 rounded-xl transition-colors"
            style={{
              color: 'var(--text-muted)',
              border: '1px dashed var(--border-default)'
            }}
          >
            + Add payment
          </button>
        </div>

        {/* Change */}
        {totals.change > 0 && (
          <div className="flex justify-between text-sm font-semibold px-3 py-2 rounded-lg"
            style={{ color: 'var(--color-success)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}>
            <span>Change</span>
            <span>&#8369;{totals.change.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {totals.remaining > 0 && payments.length > 0 && (
          <div className="flex justify-between text-sm font-semibold px-3 py-2 rounded-lg"
            style={{ color: 'var(--color-warning)', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)' }}>
            <span>Remaining</span>
            <span>&#8369;{totals.remaining.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs px-3 py-2 rounded-lg"
            style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}

        {/* Pay button — 56px height primary CTA */}
        <button
          onClick={handlePay}
          disabled={items.length === 0 || completeSaleMutation.isPending}
          aria-disabled={items.length === 0 || completeSaleMutation.isPending}
          className="w-full flex items-center justify-center gap-2 font-semibold transition-all"
          style={{
            height: '56px',
            borderRadius: '10px',
            background: 'var(--accent)',
            color: '#ffffff',
            fontSize: '16px',
            letterSpacing: '-0.01em',
            border: 'none',
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            opacity: items.length === 0 ? 0.5 : 1,
            boxShadow: items.length > 0 ? 'var(--shadow-sm)' : 'none',
          }}
          onMouseEnter={e => { if (items.length > 0) { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = items.length > 0 ? 'var(--shadow-sm)' : 'none' }}
        >
          {completeSaleMutation.isPending ? (
            <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }} />
          ) : (
            <>
              Pay &#8369;{totals.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} />
      )}
      {showSupervisorModal && (
        <SupervisorPinModal
          onApproved={handleSupervisorApproved}
          onClose={() => { setShowSupervisorModal(false); setPendingDiscount(null) }}
          validatePin={async (email, pin) => {
            const res = await validateSupervisorPin(email, pin)
            return res
          }}
        />
      )}
    </div>
  )
}
