import { Schema, model, Document, Types } from 'mongoose'

const ACTIONS = [
  'login', 'logout', 'force_logout', 'void_transaction', 'refund_transaction',
  'stock_adjustment', 'stock_transfer', 'discount_override', 'user_created',
  'user_deactivated', 'role_changed', 'settings_changed', 'drawer_opened', 'drawer_closed'
] as const

export interface IActivityLog extends Document {
  userId: Types.ObjectId
  branchId: Types.ObjectId
  terminalId: string
  action: typeof ACTIONS[number]
  targetId: Types.ObjectId | null
  targetCollection: string | null
  metadata: Record<string, unknown>
  createdAt: Date
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    terminalId: { type: String, required: true },
    action: { type: String, enum: ACTIONS, required: true },
    targetId: { type: Schema.Types.ObjectId, default: null },
    targetCollection: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

activityLogSchema.index({ userId: 1, createdAt: -1 })
activityLogSchema.index({ branchId: 1, action: 1, createdAt: -1 })

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema)
