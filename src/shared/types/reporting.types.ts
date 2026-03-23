// src/shared/types/reporting.types.ts
export type ReportType = 'sales_summary' | 'sales_by_product' | 'inventory_valuation' | 'cash_drawer_report'

export interface ReportFilters {
  reportType: ReportType
  dateFrom: string
  dateTo: string
  branchId?: string
}

export interface SalesSummaryRow {
  date: string
  transactions: number
  itemsSold: number
  revenue: number
  tax: number
  discount: number
  netRevenue: number
}

export interface SalesSummaryResult {
  success: boolean
  data?: SalesSummaryRow[]
  totals?: { transactions: number; itemsSold: number; revenue: number; tax: number; discount: number; netRevenue: number }
  error?: string
}

export interface SalesByProductRow {
  productId: string
  sku: string
  name: string
  unitsSold: number
  revenue: number
  cogs: number
  grossProfit: number
}

export interface SalesByProductResult {
  success: boolean
  data?: SalesByProductRow[]
  error?: string
}

export interface InventoryValuationRow {
  productId: string
  sku: string
  name: string
  category: string
  quantity: number
  costPrice: number
  totalValue: number
}

export interface InventoryValuationResult {
  success: boolean
  data?: InventoryValuationRow[]
  totalValue?: number
  error?: string
}

export interface CashDrawerReportRow {
  openedAt: string
  closedAt: string | null
  cashierId: string
  cashierName: string
  openingCash: number
  totalSales: number
  totalCash: number
  totalCard: number
  totalMobile: number
  expectedCash: number | null
  closingCash: number | null
  variance: number | null
  status: string
}

export interface CashDrawerReportResult {
  success: boolean
  data?: CashDrawerReportRow[]
  error?: string
}

export interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
}
