// src/shared/types/dashboard.types.ts
export interface TopSellerItem {
  productId: string
  name: string
  sku: string
  unitsSold: number
  revenue: number
}

export interface LowStockItem {
  productId: string
  name: string
  sku: string
  quantity: number
  reorderPoint: number
}

export interface DashboardStats {
  todayRevenue: number
  todayTransactions: number
  todayItemsSold: number
  averageOrderValue: number
  topSellers: TopSellerItem[]
  lowStockItems: LowStockItem[]
}

export interface DashboardStatsResult {
  success: boolean
  data?: DashboardStats
  error?: string
}
