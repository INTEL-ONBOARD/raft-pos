// src/shared/types/settings.types.ts
export interface ISettings {
  storeName: string
  receiptHeader: string
  receiptFooter: string
  globalTaxRate: number
  currencySymbol: string
  lowStockDefaultThreshold: number
  terminalId: string
  requireShiftForSales: boolean
  allowNegativeInventory: boolean
  autoPrintReceipt: boolean
  printerWidth: '58mm' | '80mm'
}

export interface UpdateSettingsInput {
  storeName?: string
  receiptHeader?: string
  receiptFooter?: string
  globalTaxRate?: number
  currencySymbol?: string
  lowStockDefaultThreshold?: number
  requireShiftForSales?: boolean
  allowNegativeInventory?: boolean
  autoPrintReceipt?: boolean
  printerWidth?: '58mm' | '80mm'
}

export interface SettingsResult {
  success: boolean
  data?: ISettings
  error?: string
}
