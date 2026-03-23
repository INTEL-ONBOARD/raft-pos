// src/shared/types/transaction.types.ts
export type PaymentMethod = 'cash' | 'card' | 'gcash' | 'paymaya'
export type DiscountType = 'percent' | 'fixed'
export type TransactionStatus = 'completed' | 'voided' | 'refunded'

export interface IPayment {
  method: PaymentMethod
  amount: number
  reference: string | null
}

export interface ITransactionItem {
  productId: string
  sku: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  unitCost: number
  discountAmount: number
  discountType: DiscountType
  totalPrice: number
}

export interface ITransaction {
  _id: string
  receiptNo: string
  branchId: string
  terminalId: string
  cashierId: string
  items: ITransactionItem[]
  subtotal: number
  discountAmount: number
  discountType: DiscountType
  taxRate: number
  taxAmount: number
  totalAmount: number
  payments: IPayment[]
  isSplit: boolean
  change: number
  status: TransactionStatus
  voidedBy: string | null
  voidedAt: string | null
  voidReason: string | null
  refundedBy: string | null
  refundedAt: string | null
  refundReason: string | null
  refundedItems: Array<{ productId: string; quantity: number; refundedAt: string }>
  createdAt: string
}

export interface CompleteSaleInput {
  items: Array<{
    productId: string
    sku: string
    name: string
    unit: string
    quantity: number
    unitPrice: number
    unitCost: number
    discountAmount: number
    discountType: DiscountType
  }>
  subtotal: number
  discountAmount: number
  discountType: DiscountType
  taxRate: number
  taxAmount: number
  totalAmount: number
  payments: IPayment[]
  branchCode: string
}

export interface VoidInput {
  transactionId: string
  reason: string
}

export interface RefundInput {
  transactionId: string
  reason: string
  refundedItems: Array<{ productId: string; quantity: number }>
}

export type SaleResult =
  | { success: true; data: ITransaction }
  | { success: false; error: string }

export type TransactionResult =
  | { success: true; data: ITransaction }
  | { success: false; error: string }

export type TransactionsResult =
  | { success: true; data: ITransaction[]; total: number }
  | { success: false; error: string }
