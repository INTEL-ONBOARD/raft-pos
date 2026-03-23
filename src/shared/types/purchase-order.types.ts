// src/shared/types/purchase-order.types.ts
export type POStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'

export interface IPOReceiveHistoryEntry {
  qty: number
  receivedAt: string
  receivedBy: string
  notes: string
}

export interface IPOItem {
  productId: string
  sku: string
  name: string
  unit: string
  orderedQty: number
  receivedQty: number
  receiveHistory: IPOReceiveHistoryEntry[]
  unitCost: number
  totalCost: number   // = unitCost × orderedQty, fixed at order time
}

export interface IPurchaseOrder {
  _id: string
  poNumber: string
  supplierId: string
  branchId: string
  items: IPOItem[]
  status: POStatus
  subtotal: number
  totalAmount: number
  notes: string
  createdBy: string
  createdAt: string
  sentAt: string | null
  receivedAt: string | null
  updatedAt: string
}

export interface CreatePOInput {
  supplierId: string
  notes?: string
  items: Array<{
    productId: string
    sku: string
    name: string
    unit: string
    orderedQty: number
    unitCost: number
  }>
}

export interface UpdatePOInput extends Partial<CreatePOInput> {}

export interface ReceivePOInput {
  poId: string
  items: Array<{
    productId: string
    qty: number
    notes?: string
  }>
}

export type POResult =
  | { success: true; data: IPurchaseOrder }
  | { success: false; error: string }

export type POsResult =
  | { success: true; data: IPurchaseOrder[]; total: number }
  | { success: false; error: string }
