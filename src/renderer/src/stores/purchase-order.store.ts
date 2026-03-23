// src/renderer/src/stores/purchase-order.store.ts
import { create } from 'zustand'
import type { IPurchaseOrder } from '@shared/types/purchase-order.types'

interface PurchaseOrderState {
  purchaseOrders: IPurchaseOrder[]
  total: number
  activePO: IPurchaseOrder | null
  setPurchaseOrders: (orders: IPurchaseOrder[], total: number) => void
  setActivePO: (po: IPurchaseOrder | null) => void
  updatePurchaseOrder: (po: IPurchaseOrder) => void
  addPurchaseOrder: (po: IPurchaseOrder) => void
}

export const usePurchaseOrderStore = create<PurchaseOrderState>((set) => ({
  purchaseOrders: [],
  total: 0,
  activePO: null,
  setPurchaseOrders: (purchaseOrders, total) => set({ purchaseOrders, total }),
  setActivePO: (activePO) => set({ activePO }),
  updatePurchaseOrder: (po) =>
    set(state => ({
      purchaseOrders: state.purchaseOrders.map(p => p._id === po._id ? po : p),
      activePO: state.activePO?._id === po._id ? po : state.activePO
    })),
  addPurchaseOrder: (po) =>
    set(state => ({ purchaseOrders: [po, ...state.purchaseOrders], total: state.total + 1 }))
}))
