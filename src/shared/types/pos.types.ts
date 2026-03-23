// src/shared/types/pos.types.ts
import type { DiscountType, PaymentMethod } from './transaction.types'

export interface CartItem {
  productId: string
  sku: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  unitCost: number
  discountAmount: number
  discountType: DiscountType
  availableStock: number   // for real-time stock warning
}

export interface PaymentEntry {
  id: string  // local UUID for list key
  method: PaymentMethod
  amount: number
  reference: string
}
