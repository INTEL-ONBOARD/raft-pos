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
      const existing = state.items.find((i) => i.productId === item.productId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1 }
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
    set((state) => ({
      items:
        qty <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: qty } : i
            )
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId)
    })),

  setItemDiscount: (productId, amount, type) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, discountAmount: amount, discountType: type }
          : i
      )
    })),

  setOrderDiscount: (amount, type) =>
    set({ orderDiscount: { type, amount } }),

  clearOrderDiscount: () => set({ orderDiscount: null }),

  addPayment: (entry) =>
    set((state) => ({
      payments: [
        ...state.payments,
        { ...entry, id: window.crypto.randomUUID() }
      ]
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
    item.discountType === 'percent'
      ? base * (item.discountAmount / 100)
      : item.discountAmount
  return Math.round(Math.max(0, base - disc) * 100) / 100
}

export function selectSubtotal(state: Pick<PosState, 'items'>): number {
  return Math.round(
    state.items.reduce((sum, item) => sum + selectItemTotal(item), 0) * 100
  ) / 100
}

export function selectOrderDiscountAmount(
  subtotal: number,
  discount: PosState['orderDiscount']
): number {
  if (!discount) return 0
  return discount.type === 'percent'
    ? subtotal * (discount.amount / 100)
    : discount.amount
}

export function selectTaxAmount(afterDiscount: number, taxRate: number): number {
  // taxRate is a percentage stored as a number (e.g. 12 for 12% VAT).
  // Tax-inclusive: taxAmount = total * taxRate / (100 + taxRate)
  // Tax-exclusive: taxAmount = afterDiscount * (taxRate / 100)
  // Phase 4 uses tax-exclusive — adjust in Phase 7 settings if needed.
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
