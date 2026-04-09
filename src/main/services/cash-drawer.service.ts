// src/main/services/cash-drawer.service.ts
import { CashDrawer } from '../models/cash-drawer.model'
import { Transaction } from '../models/transaction.model'
import { ActivityLog } from '../models/activity-log.model'
import { getCashDrawerDelta } from './transaction-accounting'
import type {
  ICashDrawer,
  OpenDrawerInput,
  CloseDrawerInput
} from '@shared/types/cash-drawer.types'

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
    closedAt: doc.closedAt?.toISOString() ?? null,
    payOuts: (doc.payOuts ?? []).map((p: any) => ({
      _id: p._id?.toString(),
      amount: p.amount,
      reason: p.reason,
      category: p.category,
      recipient: p.recipient,
      recordedBy: p.recordedBy?.toString(),
      recordedAt: p.recordedAt?.toISOString(),
      status: p.status,
      reviewedBy: p.reviewedBy?.toString() ?? null,
      reviewedAt: p.reviewedAt?.toISOString() ?? null,
      reviewNote: p.reviewNote ?? null
    }))
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

  const now = new Date()
  const transactions = await Transaction.find({
    branchId: openDrawer.branchId,
    terminalId,
    $or: [
      { createdAt: { $gte: openDrawer.openedAt } },
      { voidedAt: { $gte: openDrawer.openedAt } },
      { refundedAt: { $gte: openDrawer.openedAt } }
    ]
  }).lean()

  const totals = transactions.reduce(
    (acc, txn) => {
      const delta = getCashDrawerDelta(txn as any, openDrawer.openedAt, now)
      return {
        totalSales: acc.totalSales + delta.totalSales,
        totalCash: acc.totalCash + delta.totalCash,
        totalCard: acc.totalCard + delta.totalCard,
        totalMobile: acc.totalMobile + delta.totalMobile,
        totalTransactions: acc.totalTransactions + delta.totalTransactions
      }
    },
    { totalSales: 0, totalCash: 0, totalCard: 0, totalMobile: 0, totalTransactions: 0 }
  )

  const totalSales = Math.round(totals.totalSales * 100) / 100
  const totalCash = Math.round(totals.totalCash * 100) / 100
  const totalCard = Math.round(totals.totalCard * 100) / 100
  const totalMobile = Math.round(totals.totalMobile * 100) / 100
  const totalTransactions = totals.totalTransactions

  const r2 = (n: number): number => Math.round(n * 100) / 100

  // BUG-008 FIX: Re-fetch the drawer's payouts fresh (inside the findOneAndUpdate
  // condition) so we pick up any approvals that happened after the initial read.
  // We do this by fetching again with the same status guard right before writing.
  const freshDrawer = await CashDrawer.findOne({ _id: openDrawer._id, status: 'open' }).lean()
  if (!freshDrawer) throw new Error('Drawer was already closed')

  const approvedPayOutsTotal = ((freshDrawer as any).payOuts ?? [])
    .filter((p: any) => p.status === 'approved')
    .reduce((sum: number, p: any) => sum + p.amount, 0)

  const expectedCash = r2(
    r2(openDrawer.openingCash as number) + r2(totalCash) - r2(approvedPayOutsTotal)
  )
  const variance = r2(r2(input.closingCash) - expectedCash)

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
      closedAt: now
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

export async function addPayOut(
  drawerId: string,
  input: { amount: number; reason: string; category: string; recipient: string },
  userId: string
): Promise<ICashDrawer> {
  const drawer = await CashDrawer.findOne({ _id: drawerId, status: 'open' })
  if (!drawer) throw new Error('No open drawer found')

  drawer.payOuts.push({
    amount: input.amount,
    reason: input.reason,
    category: input.category as any,
    recipient: input.recipient,
    recordedBy: userId as any,
    recordedAt: new Date(),
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null
  } as any)
  await drawer.save()

  await ActivityLog.create({
    userId,
    branchId: drawer.branchId.toString(),
    terminalId: drawer.terminalId,
    action: 'payout_recorded',
    targetId: drawer._id,
    targetCollection: 'cash_drawers',
    metadata: { amount: input.amount, reason: input.reason, category: input.category }
  }).catch(() => {})

  return toShared(drawer)
}

export async function reviewPayOut(
  drawerId: string,
  payOutId: string,
  decision: 'approved' | 'rejected',
  reviewNote: string | null,
  reviewerId: string
): Promise<ICashDrawer> {
  const drawer = await CashDrawer.findById(drawerId)
  if (!drawer) throw new Error('Drawer not found')

  const payout = drawer.payOuts.id(payOutId)
  if (!payout) throw new Error('Pay-out not found')
  if (payout.status !== 'pending') throw new Error('Pay-out already reviewed')

  payout.status = decision
  payout.reviewedBy = reviewerId as any
  payout.reviewedAt = new Date()
  payout.reviewNote = reviewNote ?? null
  await drawer.save()

  await ActivityLog.create({
    userId: reviewerId,
    branchId: drawer.branchId.toString(),
    terminalId: drawer.terminalId,
    action: `payout_${decision}`,
    targetId: drawer._id,
    targetCollection: 'cash_drawers',
    metadata: { payOutId, decision, reviewNote }
  }).catch(() => {})

  return toShared(drawer)
}

export async function getPayOuts(drawerId: string): Promise<ICashDrawer['payOuts']> {
  const drawer = await CashDrawer.findById(drawerId).lean()
  if (!drawer) throw new Error('Drawer not found')
  return toShared(drawer as any).payOuts
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
