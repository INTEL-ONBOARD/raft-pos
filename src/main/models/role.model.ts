import { Schema, model, Document } from 'mongoose'
import { ALL_PERMISSIONS, type Permission } from '@shared/types/permissions'

export interface IRole extends Document {
  name: string
  permissions: Permission[]
  maxDiscountPercent: number
  requiresSupervisorOverride: boolean
  createdAt: Date
  updatedAt: Date
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS,
      default: []
    },
    maxDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    requiresSupervisorOverride: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export const Role = model<IRole>('Role', roleSchema)
