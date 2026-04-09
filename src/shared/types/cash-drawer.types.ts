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
  openedAt: string // ISO string
  closedAt: string | null
  payOuts: Array<{
    _id: string
    amount: number
    reason: string
    category: 'supplies' | 'cod_delivery' | 'petty_cash' | 'other'
    recipient: string
    recordedBy: string
    recordedAt: string
    status: 'pending' | 'approved' | 'rejected'
    reviewedBy: string | null
    reviewedAt: string | null
    reviewNote: string | null
  }>
}

export interface OpenDrawerInput {
  openingCash: number
}

export interface PayOutInput {
  amount: number
  reason: string
  category: 'supplies' | 'cod_delivery' | 'petty_cash' | 'other'
  recipient: string
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
