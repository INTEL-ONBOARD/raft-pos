// src/main/models/branch.model.ts
import { Schema, model, Document } from 'mongoose'

export interface IBranch extends Document {
  name: string
  code: string
  address: string
  phone: string
  email: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const branchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

export const Branch = model<IBranch>('Branch', branchSchema)
