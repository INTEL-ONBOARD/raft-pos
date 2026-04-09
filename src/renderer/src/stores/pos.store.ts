// src/renderer/src/stores/pos.store.ts
import { create } from 'zustand'
import type { CartItem, PaymentEntry } from '@shared/types/pos.types'
import type { DiscountType } from '@shared/types/transaction.types'

interface PosState {
  items: CartItem[]
  orderDiscount: { type: DiscountType; amount: number } | null
  payments: PaymentEntry[]

  // Actions
  addItem: (item: Omit<CartItem, 'discountAmount' | 'discountType'>) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  setItemDiscount: (productId: string, amount: number, type: DiscountType) => void
  setOrderDiscount: (amount: number, type: DiscountType) => void
  clearOrderDiscount: () => void
  addPayment: (entry: Omit<PaymentEntry, 'id'>) => void
  removePayment: (id: string) => void
  clearCart: () => void
}

export const usePosStore = create<PosState>((set) => ({
  items: [],
  orderDiscount: null,
  payments: [],

  addItem: (item) =>
    set((state) => {
      // BUG-002 FIX: Don't add out-of-stock products
      if (item.availableStock <= 0) return state

      const existing = state.items.find((i) => i.productId === item.productId)
      if (existing) {
        // BUG-002 FIX: Cap quantity at availableStock when incrementing
        const newQty = Math.min(existing.quantity + 1, item.availableStock)
        if (newQty === existing.quantity) return state // already at max stock
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: newQty, availableStock: item.availableStock }
              : i
          )
        }
      }
      return {
        items: [
          ...state.items,
          { ...item, discountAmount: 0, discountType: 'fixed' as DiscountType }
        ]
      }
    }),

  updateQty: (productId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { items: state.items.filter((i) => i.productId !== productId) }
      }
      // BUG-002/ISSUE-006 FIX: Clamp to availableStock
      return {
        items: state.items.map((i) => {
          if (i.productId !== productId) return i
          const clamped = Math.min(qty, i.availableStock)
          return { ...i, quantity: clamped }
        })
      }
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId)
    })),

  setItemDiscount: (productId, amount, type) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, discountAmount: amount, discountType: type } : i
      )
    })),

  setOrderDiscount: (amount, type) => set({ orderDiscount: { type, amount } }),

  clearOrderDiscount: () => set({ orderDiscount: null }),

  addPayment: (entry) =>
    set((state) => ({
      payments: [...state.payments, { ...entry, id: window.crypto.randomUUID() }]
    })),

  removePayment: (id) =>
    set((state) => ({
      payments: state.payments.filter((p) => p.id !== id)
    })),

  clearCart: () => set({ items: [], orderDiscount: null, payments: [] })
}))

// ─── Selector helpers (use in components to avoid re-renders) ────────────────

export function selectItemTotal(item: CartItem): number {
  const base = item.unitPrice * item.quantity
  const disc =
    item.discountType === 'percent' ? base * (item.discountAmount / 100) : item.discountAmount
  return Math.round(Math.max(0, base - disc) * 100) / 100
}

export function selectSubtotal(state: Pick<PosState, 'items'>): number {
  return Math.round(state.items.reduce((sum, item) => sum + selectItemTotal(item), 0) * 100) / 100
}

export function selectOrderDiscountAmount(
  subtotal: number,
  discount: PosState['orderDiscount']
): number {
  if (!discount) return 0
  return discount.type === 'percent' ? subtotal * (discount.amount / 100) : discount.amount
}

export function selectTaxAmount(afterDiscount: number, taxRate: number): number {
  // taxRate is a percentage stored as a number (e.g. 12 for 12% VAT).
  // Tax-exclusive: taxAmount = afterDiscount * (taxRate / 100)
  return Math.round(afterDiscount * (taxRate / 100) * 100) / 100
}

export function selectTotalAmount(
  subtotal: number,
  orderDiscountAmount: number,
  taxAmount: number
): number {
  return Math.round(Math.max(0, subtotal - orderDiscountAmount + taxAmount) * 100) / 100
}

export function selectTotalPaid(state: Pick<PosState, 'payments'>): number {
  return state.payments.reduce((sum, p) => sum + p.amount, 0)
}

// BUG-003 FIX: Selector that returns true when any cart item exceeds available stock
export function selectHasStockIssues(state: Pick<PosState, 'items'>): boolean {
  return state.items.some((item) => item.quantity > item.availableStock)
}
