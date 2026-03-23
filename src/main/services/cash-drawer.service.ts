// src/main/services/cash-drawer.service.ts
import { CashDrawer } from '../models/cash-drawer.model'
import { Transaction } from '../models/transaction.model'
import { ActivityLog } from '../models/activity-log.model'
import type { ICashDrawer, OpenDrawerInput, CloseDrawerInput } from '@shared/types/cash-drawer.types'

function toShared(doc: any): ICashDrawer {
  return {
    _id: doc._id.toString(),
    branchId: doc.branchId.toString(),
    terminalId: doc.terminalId,
    cashierId: doc.cashierId.toString(),
    status: doc.status,
    openingCash: doc.openingCash,
    closingCash: doc.closingCash,
    expectedCash: doc.expectedCash,
    variance: doc.variance,
    totalSales: doc.totalSales,
    totalCash: doc.totalCash,
    totalCard: doc.totalCard,
    totalMobile: doc.totalMobile,
    totalTransactions: doc.totalTransactions,
    openedAt: doc.openedAt.toISOString(),
    closedAt: doc.closedAt?.toISOString() ?? null
  }
}

export async function openDrawer(
  input: OpenDrawerInput,
  userId: string,
  branchId: string,
  terminalId: string
): Promise<ICashDrawer> {
  // Partial unique index on terminalId where status='open' will throw on duplicate
  const drawer = await CashDrawer.create({
    branchId,
    terminalId,
    cashierId: userId,
    status: 'open',
    openingCash: input.openingCash,
    openedAt: new Date()
  })

  await ActivityLog.create({
    userId,
    branchId,
    terminalId,
    action: 'drawer_opened',
    targetId: drawer._id,
    targetCollection: 'cash_drawers',
    metadata: { openingCash: input.openingCash }
  }).catch(() => {})

  return toShared(drawer)
}

export async function closeDrawer(
  input: CloseDrawerInput,
  userId: string,
  _branchId: string,
  terminalId: string
): Promise<ICashDrawer> {
  // Read the open drawer first to get openedAt/branchId for the aggregation
  const openDrawer = await CashDrawer.findOne({ terminalId, status: 'open' }).lean()
  if (!openDrawer) throw new Error('No open drawer found for this terminal')

  // Aggregate sales since drawer was opened
  const [agg] = await Transaction.aggregate([
    {
      $match: {
        branchId: openDrawer.branchId,
        terminalId,
        status: 'completed',
        createdAt: { $gte: openDrawer.openedAt }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        totalTransactions: { $sum: 1 },
        totalCash: {
          $sum: {
            $reduce: {
              input: '$payments',
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ['$$this.method', 'cash'] },
                  { $add: ['$$value', '$$this.amount'] },
                  '$$value'
                ]
              }
            }
          }
        },
        totalCard: {
          $sum: {
            $reduce: {
              input: '$payments',
              initialValue: 0,
              in: {
                $cond: [
                  { $eq: ['$$this.method', 'card'] },
                  { $add: ['$$value', '$$this.amount'] },
                  '$$value'
                ]
              }
            }
          }
        },
        totalMobile: {
          $sum: {
            $reduce: {
              input: '$payments',
              initialValue: 0,
              in: {
                $cond: [
                  { $in: ['$$this.method', ['gcash', 'paymaya']] },
                  { $add: ['$$value', '$$this.amount'] },
                  '$$value'
                ]
              }
            }
          }
        }
      }
    }
  ])

  const totalSales = agg?.totalSales ?? 0
  const totalCash = agg?.totalCash ?? 0
  const totalCard = agg?.totalCard ?? 0
  const totalMobile = agg?.totalMobile ?? 0
  const totalTransactions = agg?.totalTransactions ?? 0

  const expectedCash = Math.round(((openDrawer.openingCash as number) + totalCash) * 100) / 100
  const variance = Math.round((input.closingCash - expectedCash) * 100) / 100

  // Atomic close: only succeeds if drawer is still 'open' (prevents double-close race)
  const updated = await CashDrawer.findOneAndUpdate(
    { _id: openDrawer._id, status: 'open' },
    {
      status: 'closed',
      closingCash: input.closingCash,
      expectedCash,
      variance,
      totalSales,
      totalCash,
      totalCard,
      totalMobile,
      totalTransactions,
      closedAt: new Date()
    },
    { new: true }
  )
  if (!updated) throw new Error('Failed to close drawer')

  await ActivityLog.create({
    userId,
    branchId: openDrawer.branchId.toString(),
    terminalId,
    action: 'drawer_closed',
    targetId: updated._id,
    targetCollection: 'cash_drawers',
    metadata: { closingCash: input.closingCash, expectedCash, variance }
  }).catch(() => {})

  return toShared(updated)
}

export async function getOpenDrawer(terminalId: string): Promise<ICashDrawer | null> {
  const drawer = await CashDrawer.findOne({ terminalId, status: 'open' }).lean()
  return drawer ? toShared(drawer) : null
}

export async function getDrawers(
  branchId: string | null,
  opts?: { limit?: number; skip?: number }
): Promise<{ data: ICashDrawer[]; total: number }> {
  const query: any = {}
  if (branchId) query.branchId = branchId

  const [data, total] = await Promise.all([
    CashDrawer.find(query)
      .sort({ openedAt: -1 })
      .skip(opts?.skip ?? 0)
      .limit(opts?.limit ?? 50)
      .lean(),
    CashDrawer.countDocuments(query)
  ])
  return { data: data.map(toShared), total }
}
