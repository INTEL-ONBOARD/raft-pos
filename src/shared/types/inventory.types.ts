export type AdjustmentType = 'in' | 'out' | 'adjustment'

export interface IInventory {
  _id: string
  productId: string
  branchId: string
  quantity: number
  lowStockThreshold: number
  reorderPoint: number
}

export interface IStockAdjustment {
  _id: string
  branchId: string
  productId: string
  type: AdjustmentType
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  notes: string
  createdBy: string
  createdAt: string
}

export interface StockLevelRow extends IInventory {
  productName: string
  productSku: string
  productUnit: string
  isLowStock: boolean
}

export interface ManualAdjustmentInput {
  productId: string
  type: AdjustmentType
  quantity: number
  reason: string
  notes?: string
}

export type InventoryResult =
  | { success: true; data: IInventory }
  | { success: false; error: string }

export type StockLevelsResult =
  | { success: true; data: StockLevelRow[] }
  | { success: false; error: string }

export type AdjustmentResult =
  | { success: true; data: IStockAdjustment }
  | { success: false; error: string }
