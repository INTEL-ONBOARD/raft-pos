// src/main/models/counter.model.ts
import { Schema, model, Document } from 'mongoose'

export interface ICounter extends Document {
  key: string
  seq: number
}

const counterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
}, { timestamps: false })

export const Counter = model<ICounter>('Counter', counterSchema)
