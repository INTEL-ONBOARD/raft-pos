import { Schema, model, Document, Types } from 'mongoose'

const UNITS = ['pcs', 'kg', 'm', 'box', 'roll', 'set', 'pair'] as const

export interface IProduct extends Document {
  sku: string
  name: string
  description: string
  categoryId: Types.ObjectId | null
  unit: typeof UNITS[number]
  costPrice: number
  sellingPrice: number
  barcode: string
  imageUrl: string | null
  taxRate: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    unit: { type: String, enum: UNITS, required: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    barcode: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: null },
    taxRate: { type: Number, default: null, min: 0, max: 100 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

productSchema.index({ name: 'text', sku: 'text' })
productSchema.index({ barcode: 1 }, { sparse: true })
productSchema.index({ categoryId: 1 })
productSchema.index({ isActive: 1 })

export const Product = model<IProduct>('Product', productSchema)
