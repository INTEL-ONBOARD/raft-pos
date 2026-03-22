import { create } from 'zustand'
import type { StockLevelRow } from '@shared/types/inventory.types'

interface InventoryState {
  stockLevels: StockLevelRow[]
  setStockLevels: (rows: StockLevelRow[]) => void
  updateStockLevel: (productId: string, quantity: number) => void
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stockLevels: [],
  setStockLevels: (rows) => set({ stockLevels: rows }),
  updateStockLevel: (productId, quantity) =>
    set(state => ({
      stockLevels: state.stockLevels.map(r =>
        r.productId === productId
          ? { ...r, quantity, isLowStock: quantity <= r.lowStockThreshold }
          : r
      )
    }))
}))
