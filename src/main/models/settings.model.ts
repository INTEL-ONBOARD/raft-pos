// src/main/models/settings.model.ts
import { Schema, model, Document } from 'mongoose'

export interface ISettingsDoc extends Document {
  storeName: string
  receiptHeader: string
  receiptFooter: string
  globalTaxRate: number
  currencySymbol: string
  lowStockDefaultThreshold: number
}

const settingsSchema = new Schema<ISettingsDoc>({
  storeName: { type: String, default: 'Raft Hardware Store' },
  receiptHeader: { type: String, default: '' },
  receiptFooter: { type: String, default: 'Thank you for your purchase!' },
  globalTaxRate: { type: Number, default: 12, min: 0, max: 100 },
  currencySymbol: { type: String, default: '₱' },
  lowStockDefaultThreshold: { type: Number, default: 10, min: 0 }
})

export const Settings = model<ISettingsDoc>('Settings', settingsSchema)
