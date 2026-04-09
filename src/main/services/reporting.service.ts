// src/main/services/reporting.service.ts
import mongoose from 'mongoose'
import { Transaction } from '../models/transaction.model'
import { Inventory } from '../models/inventory.model'
import { CashDrawer } from '../models/cash-drawer.model'
import { User } from '../models/user.model'
import { getNetProductMetrics, getNetTransactionMetrics } from './transaction-accounting'
import type {
  ReportFilters,
  SalesSummaryRow,
  SalesByProductRow,
  InventoryValuationRow,
  CashDrawerReportRow
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
  const match: any = {
    createdAt: { $gte: start, $lte: end }
  }
  if (filters.branchId) match.branchId = new mongoose.Types.ObjectId(filters.branchId)

  const transactions = await Transaction.find(match).sort({ createdAt: 1 }).lean()
  const rows = transactions.reduce((map, txn) => {
    const date = new Date(txn.createdAt).toISOString().slice(0, 10)
    const metrics = getNetTransactionMetrics(txn as any)
    const current = map.get(date) ?? {
      date,
      transactions: 0,
      itemsSold: 0,
      revenue: 0,
      tax: 0,
      discount: 0,
      netRevenue: 0
    }

    current.transactions += metrics.transactions
    current.itemsSold += metrics.itemsSold
    current.revenue += metrics.revenue
    current.tax += metrics.tax
    current.discount += metrics.discount
    current.netRevenue += metrics.netRevenue
    map.set(date, current)
    return map
  }, new Map<string, SalesSummaryRow>())

  const data: SalesSummaryRow[] = Array.from(rows.values())
    .map((row) => ({
      ...row,
      revenue: Math.round(row.revenue * 100) / 100,
      tax: Math.round(row.tax * 100) / 100,
      discount: Math.round(row.discount * 100) / 100,
      netRevenue: Math.round(row.netRevenue * 100) / 100
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const totals = data.reduce(
    (acc, r) => ({
      transactions: acc.transactions + r.transactions,
      itemsSold: acc.itemsSold + r.itemsSold,
      revenue: acc.revenue + r.revenue,
      tax: acc.tax + r.tax,
      discount: acc.discount + r.discount,
      netRevenue: acc.netRevenue + r.netRevenue
    }),
    { transactions: 0, itemsSold: 0, revenue: 0, tax: 0, discount: 0, netRevenue: 0 }
  )

  return { data, totals }
}

export async function getSalesByProduct(filters: ReportFilters): Promise<SalesByProductRow[]> {
  const { start, end } = dateRange(filters.dateFrom, filters.dateTo)
  const match: any = {
    createdAt: { $gte: start, $lte: end }
  }
  if (filters.branchId) match.branchId = new mongoose.Types.ObjectId(filters.branchId)

  const transactions = await Transaction.find(match).lean()
  const productMap = new Map<string, SalesByProductRow>()

  for (const txn of transactions) {
    for (const metric of getNetProductMetrics(txn as any)) {
      const current = productMap.get(metric.productId) ?? {
        productId: metric.productId,
        sku: metric.sku,
        name: metric.name,
        unitsSold: 0,
        revenue: 0,
        cogs: 0,
        grossProfit: 0
      }

      current.unitsSold += metric.unitsSold
      current.revenue += metric.revenue
      current.cogs += metric.cogs
      current.grossProfit = current.revenue - current.cogs
      productMap.set(metric.productId, current)
    }
  }

  return Array.from(productMap.values())
    .filter((row) => row.unitsSold > 0 || row.revenue > 0 || row.cogs > 0)
    .map((row) => ({
      ...row,
      revenue: Math.round(row.revenue * 100) / 100,
      cogs: Math.round(row.cogs * 100) / 100,
      grossProfit: Math.round(row.grossProfit * 100) / 100
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

export async function getInventoryValuation(
  filters: ReportFilters
): Promise<{ data: InventoryValuationRow[]; totalValue: number }> {
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

  const data: InventoryValuationRow[] = rows.map((r) => ({
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
