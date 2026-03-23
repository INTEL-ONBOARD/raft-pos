// src/shared/types/settings.types.ts
export interface ISettings {
  storeName: string
  receiptHeader: string
  receiptFooter: string
  globalTaxRate: number
  currencySymbol: string
  lowStockDefaultThreshold: number
  terminalId: string
}

export interface UpdateSettingsInput {
  storeName?: string
  receiptHeader?: string
  receiptFooter?: string
  globalTaxRate?: number
  currencySymbol?: string
  lowStockDefaultThreshold?: number
}

export interface SettingsResult {
  success: boolean
  data?: ISettings
  error?: string
}
