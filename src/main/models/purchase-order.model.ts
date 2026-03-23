// src/main/models/purchase-order.model.ts
import { Schema, model, Document, Types } from 'mongoose'

const receiveHistorySchema = new Schema({
  qty: { type: Number, required: true },
  receivedAt: { type: Date, required: true },
  receivedBy: { type: Schema.Types.ObjectId, required: true },
  notes: { type: String, default: '' }
}, { _id: false })

const poItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  orderedQty: { type: Number, required: true, min: 0.001 },
  receivedQty: { type: Number, default: 0 },
  receiveHistory: [receiveHistorySchema],
  unitCost: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true }
}, { _id: false })

export interface IPurchaseOrder extends Document {
  poNumber: string
  supplierId: Types.ObjectId
  branchId: Types.ObjectId
  items: any[]
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'
  subtotal: number
  totalAmount: number
  notes: string
  createdBy: Types.ObjectId
  sentAt: Date | null
  receivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    branchId: { type: Schema.Types.ObjectId, required: true },
    items: [poItemSchema],
    status: { type: String, enum: ['draft', 'sent', 'partial', 'received', 'cancelled'], default: 'draft' },
    subtotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sentAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null }
  },
  { timestamps: true }
)

purchaseOrderSchema.index({ branchId: 1, status: 1, createdAt: -1 })
purchaseOrderSchema.index({ supplierId: 1, createdAt: -1 })

export const PurchaseOrder = model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema)
