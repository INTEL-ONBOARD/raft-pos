// src/shared/types/cash-drawer.types.ts
export type DrawerStatus = 'open' | 'closed'

export interface ICashDrawer {
  _id: string
  branchId: string
  terminalId: string
  cashierId: string
  status: DrawerStatus
  openingCash: number
  closingCash: number | null
  expectedCash: number | null
  variance: number | null
  totalSales: number
  totalCash: number
  totalCard: number
  totalMobile: number
  totalTransactions: number
  openedAt: string       // ISO string
  closedAt: string | null
}

export interface OpenDrawerInput {
  openingCash: number
}

export interface CloseDrawerInput {
  closingCash: number
}

export interface DrawerResult {
  success: boolean
  data?: ICashDrawer
  error?: string
}

export interface DrawersResult {
  success: boolean
  data?: ICashDrawer[]
  total?: number
  error?: string
}

export interface OpenDrawerResult {
  success: boolean
  data?: ICashDrawer
  error?: string
}
