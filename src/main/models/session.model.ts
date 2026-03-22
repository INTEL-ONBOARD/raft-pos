import { Schema, model, Document, Types } from 'mongoose'

export interface ISession extends Document {
  userId: Types.ObjectId
  terminalId: string
  jwtId: string           // jti claim from JWT
  issuedAt: Date
  expiresAt: Date
  isRevoked: boolean
  revokedAt: Date | null
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  terminalId: { type: String, required: true },
  jwtId: { type: String, required: true, unique: true },
  issuedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
  revokedAt: { type: Date, default: null }
})

// Index for fast session lookup on every IPC auth check
sessionSchema.index({ jwtId: 1 })
// TTL index to auto-delete expired sessions after 24h
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 })

export const Session = model<ISession>('Session', sessionSchema)
