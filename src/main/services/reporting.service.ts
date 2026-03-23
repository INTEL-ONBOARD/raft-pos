// src/main/services/reporting.service.ts
import mongoose from 'mongoose'
import { Transaction } from '../models/transaction.model'
import { Inventory } from '../models/inventory.model'
import { CashDrawer } from '../models/cash-drawer.model'
import { User } from '../models/user.model'
import type {
  ReportFilters, SalesSummaryRow, SalesByProductRow,
  InventoryValuationRow, CashDrawerReportRow
} from '@shared/types/reporting.types'

function dateRange(dateFrom: string, dateTo: string) {
  const start = new Date(dateFrom)
  start.setHours(0, 0, 0, 0)
  const end = new Date(dateTo)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export async function getSalesSummary(filters: ReportFilters) {
  const { start, end } = dateRange(filters.dateFrom, filters.dateTo)
  const match: any = { status: 'completed', createdAt: { $gte: start, $lte: end } }
  if (filters.branchId) match.branchId = new mongoose.Types.ObjectId(filters.branchId)

  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        transactions: { $sum: 1 },
        itemsSold: { $sum: { $sum: '$items.quantity' } },
        revenue: { $sum: '$totalAmount' },
        tax: { $sum: '$taxAmount' },
        discount: { $sum: '$discountAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ])

  const data: SalesSummaryRow[] = rows.map(r => ({
    date: r._id,
    transactions: r.transactions,
    itemsSold: r.itemsSold,
    revenue: r.revenue,
    tax: r.tax,
    discount: r.discount,
    netRevenue: r.revenue - r.tax - r.discount
  }))

  const totals = data.reduce((acc, r) => ({
    transactions: acc.transactions + r.transactions,
    itemsSold: acc.itemsSold + r.itemsSold,
    revenue: acc.revenue + r.revenue,
    tax: acc.tax + r.tax,
    discount: acc.discount + r.discount,
    netRevenue: acc.netRevenue + r.netRevenue
  }), { transactions: 0, itemsSold: 0, revenue: 0, tax: 0, discount: 0, netRevenue: 0 })

  return { data, totals }
}

export async function getSalesByProduct(filters: ReportFilters): Promise<SalesByProductRow[]> {
  const { start, end } = dateRange(filters.dateFrom, filters.dateTo)
  const match: any = { status: 'completed', createdAt: { $gte: start, $lte: end } }
  if (filters.branchId) match.branchId = new mongoose.Types.ObjectId(filters.branchId)

  const rows = await Transaction.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        sku: { $first: '$items.sku' },
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' },
        cogs: { $sum: { $multiply: ['$items.unitCost', '$items.quantity'] } }
      }
    },
    { $sort: { revenue: -1 } }
  ])

  return rows.map(r => ({
    productId: r._id.toString(),
    sku: r.sku,
    name: r.name,
    unitsSold: r.unitsSold,
    revenue: r.revenue,
    cogs: r.cogs,
    grossProfit: r.revenue - r.cogs
  }))
}

export async function getInventoryValuation(filters: ReportFilters): Promise<{ data: InventoryValuationRow[]; totalValue: number }> {
  const match: any = {}
  if (filters.branchId) match.branchId = new mongoose.Types.ObjectId(filters.branchId)

  const rows = await Inventory.aggregate([
    { $match: match },
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
      $lookup: {
        from: 'categories',
        localField: 'product.categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $project: {
        productId: '$productId',
        sku: '$product.sku',
        name: '$product.name',
        category: { $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, 'Uncategorized'] },
        quantity: '$quantity',
        costPrice: '$product.costPrice',
        totalValue: { $multiply: ['$quantity', '$product.costPrice'] }
      }
    },
    { $sort: { name: 1 } }
  ])

  const data: InventoryValuationRow[] = rows.map(r => ({
    productId: r.productId.toString(),
    sku: r.sku,
    name: r.name,
    category: r.category,
    quantity: r.quantity,
    costPrice: r.costPrice,
    totalValue: r.totalValue
  }))

  const totalValue = data.reduce((s, r) => s + r.totalValue, 0)
  return { data, totalValue }
}

export async function getCashDrawerReport(filters: ReportFilters): Promise<CashDrawerReportRow[]> {
  const { start, end } = dateRange(filters.dateFrom, filters.dateTo)
  const match: any = { openedAt: { $gte: start, $lte: end } }
  if (filters.branchId) match.branchId = new mongoose.Types.ObjectId(filters.branchId)

  const drawers = await CashDrawer.find(match).sort({ openedAt: -1 }).lean()

  const cashierIds = [...new Set(drawers.map((d: any) => d.cashierId.toString()))]
  const cashiers = await User.find({ _id: { $in: cashierIds } }).lean()
  const cashierMap = new Map(cashiers.map((c: any) => [c._id.toString(), c.name]))

  return drawers.map((d: any) => ({
    openedAt: d.openedAt.toISOString(),
    closedAt: d.closedAt?.toISOString() ?? null,
    cashierId: d.cashierId.toString(),
    cashierName: cashierMap.get(d.cashierId.toString()) ?? 'Unknown',
    openingCash: d.openingCash,
    totalSales: d.totalSales,
    totalCash: d.totalCash,
    totalCard: d.totalCard,
    totalMobile: d.totalMobile,
    expectedCash: d.expectedCash,
    closingCash: d.closingCash,
    variance: d.variance,
    status: d.status
  }))
}
