// src/main/services/dashboard.service.ts
import mongoose from 'mongoose'
import { Transaction } from '../models/transaction.model'
import { Inventory } from '../models/inventory.model'
import type { DashboardStats, TopSellerItem, LowStockItem } from '@shared/types/dashboard.types'

export async function getDashboardStats(branchId: string): Promise<DashboardStats> {
  const branchOid = new mongoose.Types.ObjectId(branchId)

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [salesStats, topSellersRaw, lowStockRaw] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          branchId: branchOid,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: '$totalAmount' },
          todayTransactions: { $sum: 1 },
          todayItemsSold: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]),

    Transaction.aggregate([
      {
        $match: {
          branchId: branchOid,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]),

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
            $and: [
              { $gt: ['$reorderPoint', 0] },
              { $lte: ['$quantity', '$reorderPoint'] }
            ]
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

  const stats = salesStats[0] ?? { todayRevenue: 0, todayTransactions: 0, todayItemsSold: 0 }
  const averageOrderValue = stats.todayTransactions > 0
    ? Math.round((stats.todayRevenue / stats.todayTransactions) * 100) / 100
    : 0

  const topSellers: TopSellerItem[] = topSellersRaw.map((r: any) => ({
    productId: r._id.toString(),
    name: r.name,
    sku: r.sku,
    unitsSold: r.unitsSold,
    revenue: r.revenue
  }))

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
