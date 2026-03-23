// src/main/models/supplier.model.ts
import { Schema, model, Document } from 'mongoose'

export interface ISupplier extends Document {
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  notes: string
  isActive: boolean
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

supplierSchema.index({ name: 1 })

export const Supplier = model<ISupplier>('Supplier', supplierSchema)
