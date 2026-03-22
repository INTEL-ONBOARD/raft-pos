import { Schema, model, Document, Types } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  supervisorPin: string | null  // bcrypt-hashed 4-digit PIN, nullable
  roleId: Types.ObjectId
  branchId: Types.ObjectId
  isActive: boolean
  lastLogin: Date | null
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    supervisorPin: { type: String, default: null },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null }
  },
  { timestamps: true }
)

// Never return password hash or supervisor PIN in queries
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const sanitized = ret as unknown as Record<string, unknown>
    delete sanitized.passwordHash
    delete sanitized.supervisorPin
    return sanitized
  }
})

export const User = model<IUser>('User', userSchema)
