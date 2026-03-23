// src/shared/types/supplier.types.ts
export interface ISupplier {
  _id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  notes: string
  isActive: boolean
  createdAt: string
}

export interface CreateSupplierInput {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  isActive?: boolean
}

export type SupplierResult =
  | { success: true; data: ISupplier }
  | { success: false; error: string }

export type SuppliersResult =
  | { success: true; data: ISupplier[] }
  | { success: false; error: string }

export interface ISupplierStats {
  supplier: ISupplier
  totalSpend: number
  orderCount: number
  recentOrders: Array<{
    _id: string
    poNumber: string
    status: string
    totalAmount: number
    createdAt: string
  }>
}

export type SupplierWithStatsResult =
  | { success: true; data: ISupplierStats }
  | { success: false; error: string }
