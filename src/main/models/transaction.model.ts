// src/main/models/transaction.model.ts
import { Schema, model, Document, Types } from 'mongoose'

const paymentSchema = new Schema({
  method: { type: String, enum: ['cash', 'card', 'gcash', 'paymaya'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String, default: null }
}, { _id: false })

const transactionItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  unitPrice: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'fixed' },
  totalPrice: { type: Number, required: true }
}, { _id: false })

export interface ITransactionItemDoc {
  productId: Types.ObjectId
  sku: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  unitCost: number
  discountAmount: number
  discountType: 'percent' | 'fixed'
  totalPrice: number
}

export interface IPaymentDoc {
  method: 'cash' | 'card' | 'gcash' | 'paymaya'
  amount: number
  reference: string | null
}

export interface ITransaction extends Document {
  receiptNo: string
  branchId: Types.ObjectId
  terminalId: string
  cashierId: Types.ObjectId
  items: ITransactionItemDoc[]
  subtotal: number
  discountAmount: number
  discountType: 'percent' | 'fixed'
  taxRate: number
  taxAmount: number
  totalAmount: number
  payments: IPaymentDoc[]
  isSplit: boolean
  change: number
  status: 'completed' | 'voided' | 'refunded'
  voidedBy: Types.ObjectId | null
  voidedAt: Date | null
  voidReason: string | null
  refundedBy: Types.ObjectId | null
  refundedAt: Date | null
  refundReason: string | null
  refundedItems: Array<{ productId: Types.ObjectId; quantity: number; refundedAt: Date }>
  createdAt: Date
}

const transactionSchema = new Schema<ITransaction>(
  {
    receiptNo: { type: String, required: true, unique: true },
    branchId: { type: Schema.Types.ObjectId, required: true },
    terminalId: { type: String, required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [transactionItemSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['percent', 'fixed'], default: 'fixed' },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    payments: [paymentSchema],
    isSplit: { type: Boolean, default: false },
    change: { type: Number, default: 0 },
    status: { type: String, enum: ['completed', 'voided', 'refunded'], default: 'completed' },
    voidedBy: { type: Schema.Types.ObjectId, default: null },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, default: null },
    refundedBy: { type: Schema.Types.ObjectId, default: null },
    refundedAt: { type: Date, default: null },
    refundReason: { type: String, default: null },
    refundedItems: [{
      productId: { type: Schema.Types.ObjectId, required: true },
      quantity: { type: Number, required: true },
      refundedAt: { type: Date, required: true }
    }]
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

transactionSchema.index({ branchId: 1, createdAt: -1 })
transactionSchema.index({ cashierId: 1, createdAt: -1 })
transactionSchema.index({ status: 1 })

export const Transaction = model<ITransaction>('Transaction', transactionSchema)
