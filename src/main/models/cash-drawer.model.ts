// src/main/models/cash-drawer.model.ts
import { Schema, model, Document, Types } from 'mongoose'

export interface IPayOutDoc {
  _id: Types.ObjectId
  amount: number
  reason: string
  category: 'supplies' | 'cod_delivery' | 'petty_cash' | 'other'
  recipient: string
  recordedBy: Types.ObjectId
  recordedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: Types.ObjectId | null
  reviewedAt: Date | null
  reviewNote: string | null
}

const payOutSchema = new Schema<IPayOutDoc>({
  amount: { type: Number, required: true, min: 0.01 },
  reason: { type: String, required: true, trim: true },
  category: { type: String, enum: ['supplies', 'cod_delivery', 'petty_cash', 'other'], required: true },
  recipient: { type: String, required: true, trim: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recordedAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: Schema.Types.ObjectId, default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: null },
})

export interface ICashDrawerDoc extends Document {
  branchId: Types.ObjectId
  terminalId: string
  cashierId: Types.ObjectId
  status: 'open' | 'closed'
  openingCash: number
  closingCash: number | null
  expectedCash: number | null
  variance: number | null
  totalSales: number
  totalCash: number
  totalCard: number
  totalMobile: number
  totalTransactions: number
  openedAt: Date
  closedAt: Date | null
  payOuts: Types.DocumentArray<IPayOutDoc>
}

const cashDrawerSchema = new Schema<ICashDrawerDoc>(
  {
    branchId: { type: Schema.Types.ObjectId, required: true },
    terminalId: { type: String, required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'closed'], required: true, default: 'open' },
    openingCash: { type: Number, required: true, min: 0 },
    closingCash: { type: Number, default: null },
    expectedCash: { type: Number, default: null },
    variance: { type: Number, default: null },
    totalSales: { type: Number, default: 0 },
    totalCash: { type: Number, default: 0 },
    totalCard: { type: Number, default: 0 },
    totalMobile: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    openedAt: { type: Date, required: true },
    closedAt: { type: Date, default: null },
    payOuts: { type: [payOutSchema], default: [] },
  },
  { timestamps: false }
)

// DB-enforced: only one open drawer per terminal at a time
cashDrawerSchema.index(
  { terminalId: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } }
)
cashDrawerSchema.index({ branchId: 1, openedAt: -1 })

export const CashDrawer = model<ICashDrawerDoc>('CashDrawer', cashDrawerSchema)
