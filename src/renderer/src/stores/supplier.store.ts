// src/renderer/src/stores/supplier.store.ts
import { create } from 'zustand'
import type { ISupplier } from '@shared/types/supplier.types'

interface SupplierState {
  suppliers: ISupplier[]
  setSuppliers: (suppliers: ISupplier[]) => void
  addSupplier: (supplier: ISupplier) => void
  updateSupplier: (supplier: ISupplier) => void
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: [],
  setSuppliers: (suppliers) => set({ suppliers }),
  addSupplier: (supplier) =>
    set(state => ({ suppliers: [supplier, ...state.suppliers] })),
  updateSupplier: (supplier) =>
    set(state => ({
      suppliers: state.suppliers.map(s => s._id === supplier._id ? supplier : s)
    }))
}))
