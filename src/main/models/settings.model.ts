// src/main/models/settings.model.ts
import { Schema, model, Document } from 'mongoose'

export interface ISettingsDoc extends Document {
  storeName: string
  receiptHeader: string
  receiptFooter: string
  globalTaxRate: number
  currencySymbol: string
  lowStockDefaultThreshold: number
  requireShiftForSales: boolean
  allowNegativeInventory: boolean
  autoPrintReceipt: boolean
  printerWidth: '58mm' | '80mm'
}

const settingsSchema = new Schema<ISettingsDoc>({
  storeName: { type: String, default: 'Raft Hardware Store' },
  receiptHeader: { type: String, default: '' },
  receiptFooter: { type: String, default: 'Thank you for your purchase!' },
  globalTaxRate: { type: Number, default: 12, min: 0, max: 100 },
  currencySymbol: { type: String, default: '₱' },
  lowStockDefaultThreshold: { type: Number, default: 10, min: 0 },
  requireShiftForSales: { type: Boolean, default: true },
  allowNegativeInventory: { type: Boolean, default: false },
  autoPrintReceipt: { type: Boolean, default: false },
  printerWidth: { type: String, default: '80mm', enum: ['58mm', '80mm'] }
})

export const Settings = model<ISettingsDoc>('Settings', settingsSchema)
