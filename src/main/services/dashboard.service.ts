// src/main/services/dashboard.service.ts
import mongoose from 'mongoose'
import { Transaction } from '../models/transaction.model'
import { Inventory } from '../models/inventory.model'
import { getNetProductMetrics, getNetTransactionMetrics } from './transaction-accounting'
import type { DashboardStats, TopSellerItem, LowStockItem } from '@shared/types/dashboard.types'

export async function getDashboardStats(branchId: string): Promise<DashboardStats> {
  const branchOid = new mongoose.Types.ObjectId(branchId)

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [todaysTransactions, lowStockRaw] = await Promise.all([
    Transaction.find({
      branchId: branchOid,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).lean(),

    Inventory.aggregate([
      { $match: { branchId: branchOid } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $match: {
          'product.isActive': true,
          $expr: {
            $and: [{ $gt: ['$reorderPoint', 0] }, { $lte: ['$quantity', '$reorderPoint'] }]
          }
        }
      },
      {
        $project: {
          productId: 1,
          name: '$product.name',
          sku: '$product.sku',
          quantity: 1,
          reorderPoint: 1
        }
      },
      { $sort: { quantity: 1 } },
      { $limit: 20 }
    ])
  ])

  const stats = todaysTransactions.reduce(
    (acc, txn) => {
      const metrics = getNetTransactionMetrics(txn as any)
      acc.todayRevenue += metrics.revenue
      acc.todayTransactions += metrics.transactions
      acc.todayItemsSold += metrics.itemsSold
      return acc
    },
    { todayRevenue: 0, todayTransactions: 0, todayItemsSold: 0 }
  )
  const averageOrderValue =
    stats.todayTransactions > 0
      ? Math.round((stats.todayRevenue / stats.todayTransactions) * 100) / 100
      : 0

  const topSellerMap = new Map<string, TopSellerItem>()
  for (const txn of todaysTransactions) {
    for (const metric of getNetProductMetrics(txn as any)) {
      if (metric.unitsSold <= 0 && metric.revenue <= 0) continue
      const current = topSellerMap.get(metric.productId) ?? {
        productId: metric.productId,
        name: metric.name,
        sku: metric.sku,
        unitsSold: 0,
        revenue: 0
      }
      current.unitsSold += metric.unitsSold
      current.revenue += metric.revenue
      topSellerMap.set(metric.productId, current)
    }
  }

  const topSellers: TopSellerItem[] = Array.from(topSellerMap.values())
    .map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const lowStockItems: LowStockItem[] = lowStockRaw.map((r: any) => ({
    productId: r.productId.toString(),
    name: r.name,
    sku: r.sku,
    quantity: r.quantity,
    reorderPoint: r.reorderPoint
  }))

  return {
    todayRevenue: stats.todayRevenue,
    todayTransactions: stats.todayTransactions,
    todayItemsSold: stats.todayItemsSold,
    averageOrderValue,
    topSellers,
    lowStockItems
  }
}
