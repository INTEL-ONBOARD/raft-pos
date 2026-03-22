import { Schema, model, Document, Types } from 'mongoose'

const ADJUSTMENT_TYPES = [
  'in', 'out', 'transfer_out', 'transfer_in', 'adjustment',
  'purchase_received', 'sale', 'void_return', 'refund_return'
] as const

export interface IStockAdjustment extends Document {
  branchId: Types.ObjectId
  productId: Types.ObjectId
  type: typeof ADJUSTMENT_TYPES[number]
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  notes: string
  fromBranchId: Types.ObjectId | null
  toBranchId: Types.ObjectId | null
  purchaseOrderId: Types.ObjectId | null
  transactionId: Types.ObjectId | null
  transferId: Types.ObjectId | null
  createdBy: Types.ObjectId
  createdAt: Date
}

const stockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ADJUSTMENT_TYPES, required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, required: true },
    notes: { type: String, default: '' },
    fromBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
    toBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', default: null },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', default: null },
    transferId: { type: Schema.Types.ObjectId, ref: 'StockTransfer', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

stockAdjustmentSchema.index({ branchId: 1, createdAt: -1 })
stockAdjustmentSchema.index({ productId: 1, branchId: 1 })
stockAdjustmentSchema.index({ transactionId: 1 }, { sparse: true })

export const StockAdjustment = model<IStockAdjustment>('StockAdjustment', stockAdjustmentSchema)
