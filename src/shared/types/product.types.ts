export type ProductUnit = 'pcs' | 'kg' | 'm' | 'box' | 'roll' | 'set' | 'pair'

export interface IProduct {
  _id: string
  sku: string
  name: string
  description: string
  categoryId: string | null
  unit: ProductUnit
  costPrice: number
  sellingPrice: number
  barcode: string
  imageUrl: string | null
  taxRate: number | null   // null = use global tax rate
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  sku: string
  name: string
  description?: string
  categoryId?: string | null
  unit: ProductUnit
  costPrice: number
  sellingPrice: number
  barcode?: string
  imageUrl?: string | null
  taxRate?: number | null
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  isActive?: boolean
}

export type ProductResult =
  | { success: true; data: IProduct }
  | { success: false; error: string }

export type ProductsResult =
  | { success: true; data: IProduct[]; total: number }
  | { success: false; error: string }
