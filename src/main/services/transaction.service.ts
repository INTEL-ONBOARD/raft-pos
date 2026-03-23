// src/main/services/transaction.service.ts
import mongoose from 'mongoose'
import { Transaction } from '../models/transaction.model'
import { Counter } from '../models/counter.model'
import { Inventory } from '../models/inventory.model'
import { StockAdjustment } from '../models/stock-adjustment.model'
import { ActivityLog } from '../models/activity-log.model'
import type {
  CompleteSaleInput,
  ITransaction,
  VoidInput,
  RefundInput
} from '@shared/types/transaction.types'

// ─── helpers ────────────────────────────────────────────────────────────────

function roundCents(n: number): number {
  return Math.round(n * 100) / 100
}

function computeItemTotal(item: CompleteSaleInput['items'][number]): number {
  const base = item.unitPrice * item.quantity
  const disc =
    item.discountType === 'percent'
      ? base * (item.discountAmount / 100)
      : item.discountAmount
  return roundCents(Math.max(0, base - disc))
}

function computeTotal(input: CompleteSaleInput): number {
  const itemsTotal = input.items.reduce(
    (sum, it) => sum + computeItemTotal(it),
    0
  )
  const orderDisc =
    input.discountType === 'percent'
      ? itemsTotal * (input.discountAmount / 100)
      : input.discountAmount
  return roundCents(Math.max(0, itemsTotal - orderDisc) + input.taxAmount)
}

function toShared(doc: any): ITransaction {
  return {
    _id: doc._id.toString(),
    receiptNo: doc.receiptNo,
    branchId: doc.branchId.toString(),
    terminalId: doc.terminalId,
    cashierId: doc.cashierId.toString(),
    items: doc.items.map((it: any) => ({
      productId: it.productId.toString(),
      sku: it.sku,
      name: it.name,
      unit: it.unit,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      unitCost: it.unitCost,
      discountAmount: it.discountAmount,
      discountType: it.discountType,
      totalPrice: it.totalPrice
    })),
    subtotal: doc.subtotal,
    discountAmount: doc.discountAmount,
    discountType: doc.discountType,
    taxRate: doc.taxRate,
    taxAmount: doc.taxAmount,
    totalAmount: doc.totalAmount,
    payments: doc.payments.map((p: any) => ({
      method: p.method,
      amount: p.amount,
      reference: p.reference
    })),
    isSplit: doc.isSplit,
    change: doc.change,
    status: doc.status,
    voidedBy: doc.voidedBy?.toString() ?? null,
    voidedAt: doc.voidedAt?.toISOString() ?? null,
    voidReason: doc.voidReason,
    refundedBy: doc.refundedBy?.toString() ?? null,
    refundedAt: doc.refundedAt?.toISOString() ?? null,
    refundReason: doc.refundReason,
    refundedItems: (doc.refundedItems ?? []).map((r: any) => ({
      productId: r.productId.toString(),
      quantity: r.quantity,
      refundedAt: r.refundedAt.toISOString()
    })),
    createdAt: doc.createdAt.toISOString()
  }
}

// ─── receipt numbering ───────────────────────────────────────────────────────

export async function generateReceiptNo(branchCode: string, session?: mongoose.ClientSession): Promise<string> {
  const date = new Date()
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const key = `receipt_${branchCode}_${ymd}`
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, ...(session ? { session } : {}) }
  )
  if (!counter) throw new Error('Failed to generate receipt number')
  return `${branchCode}-${ymd}-${String(counter.seq).padStart(4, '0')}`
}

// ─── completeSale ────────────────────────────────────────────────────────────

export async function completeSale(
  input: CompleteSaleInput,
  userId: string,
  branchId: string,
  terminalId: string
): Promise<ITransaction> {
  // branchCode is passed from the renderer via CompleteSaleInput.
  // Phase 7 settings will populate this properly; for now the renderer defaults to 'BR'.
  const branchCode: string = input.branchCode ?? 'BR'

  // Validate renderer-computed total (guard against tampering or rounding bugs)
  const recomputed = computeTotal(input)
  if (Math.abs(recomputed - input.totalAmount) > 0.01) {
    throw new Error(
      `Total mismatch: renderer sent ${input.totalAmount}, server computed ${recomputed}`
    )
  }

  const totalPaid = input.payments.reduce((s, p) => s + p.amount, 0)
  const change = roundCents(Math.max(0, totalPaid - input.totalAmount))

  const session = await mongoose.startSession()
  let savedTxn: any
  try {
    await session.withTransaction(async () => {
      // Generate receipt number INSIDE session so counter increment is atomic with txn insert
      const receiptNo = await generateReceiptNo(branchCode, session)

      // 1. Insert transaction document
      const [txn] = await Transaction.create(
        [
          {
            receiptNo,
            branchId,
            terminalId,
            cashierId: userId,
            items: input.items.map((it) => ({
              ...it,
              totalPrice: computeItemTotal(it)
            })),
            subtotal: input.subtotal,
            discountAmount: input.discountAmount,
            discountType: input.discountType,
            taxRate: input.taxRate,
            taxAmount: input.taxAmount,
            totalAmount: input.totalAmount,
            payments: input.payments.map((p) => ({
              method: p.method,
              amount: p.amount,
              reference: p.reference ?? null
            })),
            isSplit: input.payments.length > 1,
            change,
            status: 'completed'
          }
        ],
        { session }
      )
      savedTxn = txn

      // 2. Decrement inventory + insert sale adjustments for each line item
      for (const item of input.items) {
        const prevInv = await Inventory.findOne(
          { productId: item.productId, branchId },
          { quantity: 1 },
          { session, lean: true }
        )
        const previousStock: number = (prevInv as any)?.quantity ?? 0

        const updatedInv = await Inventory.findOneAndUpdate(
          { productId: item.productId, branchId, quantity: { $gte: item.quantity } },
          { $inc: { quantity: -item.quantity } },
          { session, new: true, runValidators: true }
        )
        if (!updatedInv) {
          throw new Error(`Insufficient stock for product ${item.sku}`)
        }
        const newStock: number = (updatedInv as any).quantity

        await StockAdjustment.create(
          [
            {
              branchId,
              productId: item.productId,
              type: 'sale',
              quantity: item.quantity,
              previousStock,
              newStock,
              reason: `Sale ${receiptNo}`,
              notes: '',
              createdBy: userId,
              transactionId: txn._id
            }
          ],
          { session }
        )
      }
    })
  } finally {
    await session.endSession()
  }

  // Activity log (non-fatal)
  await ActivityLog.create({
    userId,
    branchId,
    terminalId,
    action: 'sale_completed',
    targetId: savedTxn._id,
    targetCollection: 'transactions',
    metadata: { receiptNo: savedTxn.receiptNo, totalAmount: savedTxn.totalAmount }
  }).catch(() => {})

  return toShared(savedTxn)
}

// ─── voidTransaction ─────────────────────────────────────────────────────────

export async function voidTransaction(
  input: VoidInput,
  userId: string,
  branchId: string,
  terminalId: string
): Promise<ITransaction> {
  const txn = await Transaction.findById(input.transactionId)
  if (!txn) throw new Error('Transaction not found')
  if (txn.status !== 'completed') throw new Error('Only completed transactions can be voided')
  if (txn.branchId.toString() !== branchId) throw new Error('Transaction belongs to a different branch')

  const session = await mongoose.startSession()
  let updated: any
  try {
    await session.withTransaction(async () => {
      // 1. Atomically update transaction status only if still 'completed'
      updated = await Transaction.findOneAndUpdate(
        { _id: input.transactionId, status: 'completed' },
        {
          status: 'voided',
          voidedBy: userId,
          voidedAt: new Date(),
          voidReason: input.reason
        },
        { session, new: true }
      )
      if (!updated) throw new Error('Transaction not found or already voided/refunded')

      // 2. Reverse inventory for each item + create void_return adjustments
      for (const item of updated.items as any[]) {
        const restoredInv = await Inventory.findOneAndUpdate(
          { productId: item.productId, branchId },
          { $inc: { quantity: item.quantity } },
          { session, new: true }
        )
        if (restoredInv) {
          const newStock: number = (restoredInv as any).quantity
          const previousStock = newStock - item.quantity
          // Only create adjustment if inventory record existed
          await StockAdjustment.create(
            [
              {
                branchId,
                productId: item.productId,
                type: 'void_return',
                quantity: item.quantity,
                previousStock,
                newStock,
                reason: `Void ${updated.receiptNo}: ${input.reason}`,
                notes: '',
                createdBy: userId,
                transactionId: updated._id
              }
            ],
            { session }
          )
        }
      }
    })
  } finally {
    await session.endSession()
  }

  // Activity log (non-fatal)
  await ActivityLog.create({
    userId,
    branchId,
    terminalId,
    action: 'void_transaction',
    targetId: txn._id,
    targetCollection: 'transactions',
    metadata: { receiptNo: txn.receiptNo, reason: input.reason }
  }).catch(() => {})

  return toShared(updated)
}

// ─── refundTransaction ───────────────────────────────────────────────────────

export async function refundTransaction(
  input: RefundInput,
  userId: string,
  branchId: string,
  terminalId: string
): Promise<ITransaction> {
  const txn = await Transaction.findById(input.transactionId)
  if (!txn) throw new Error('Transaction not found')
  if (txn.status !== 'completed') throw new Error('Only completed transactions can be refunded')
  if (txn.branchId.toString() !== branchId) throw new Error('Transaction belongs to a different branch')
  if (txn.refundedItems && txn.refundedItems.length > 0) {
    throw new Error('This transaction has already been refunded')
  }

  // Validate refunded items exist in the original transaction
  const txnItems = txn.items as any[]
  for (const ri of input.refundedItems) {
    const original = txnItems.find((i: any) => i.productId.toString() === ri.productId)
    if (!original) throw new Error(`Product ${ri.productId} not in original transaction`)
    if (ri.quantity > original.quantity) throw new Error(`Refund quantity exceeds sold quantity for product ${ri.productId}`)
  }

  const now = new Date()
  const session = await mongoose.startSession()
  let updated: any
  try {
    await session.withTransaction(async () => {
      // Atomically update only if still 'completed' and no refundedItems yet
      updated = await Transaction.findOneAndUpdate(
        { _id: input.transactionId, status: 'completed', 'refundedItems.0': { $exists: false } },
        {
          status: 'refunded',
          refundedBy: userId,
          refundedAt: now,
          refundReason: input.reason,
          refundedItems: input.refundedItems.map((ri) => ({
            productId: ri.productId,
            quantity: ri.quantity,
            refundedAt: now
          }))
        },
        { session, new: true }
      )
      if (!updated) throw new Error('Transaction not found, already refunded, or not eligible for refund')

      for (const ri of input.refundedItems) {
        const restoredInv = await Inventory.findOneAndUpdate(
          { productId: ri.productId, branchId },
          { $inc: { quantity: ri.quantity } },
          { session, new: true }
        )
        if (restoredInv) {
          const newStock: number = (restoredInv as any).quantity
          const previousStock = newStock - ri.quantity
          // Only create adjustment if inventory record existed
          await StockAdjustment.create(
            [
              {
                branchId,
                productId: ri.productId,
                type: 'refund_return',
                quantity: ri.quantity,
                previousStock,
                newStock,
                reason: `Refund ${txn.receiptNo}: ${input.reason}`,
                notes: '',
                createdBy: userId,
                transactionId: txn._id
              }
            ],
            { session }
          )
        }
      }
    })
  } finally {
    await session.endSession()
  }

  await ActivityLog.create({
    userId,
    branchId,
    terminalId,
    action: 'refund_transaction',
    targetId: txn._id,
    targetCollection: 'transactions',
    metadata: { receiptNo: txn.receiptNo, reason: input.reason, refundedItems: input.refundedItems }
  }).catch(() => {})

  return toShared(updated)
}

// ─── getTransaction ──────────────────────────────────────────────────────────

export async function getTransaction(id: string): Promise<ITransaction> {
  const txn = await Transaction.findById(id).lean()
  if (!txn) throw new Error('Transaction not found')
  return toShared(txn)
}

// ─── getTransactions ─────────────────────────────────────────────────────────

export async function getTransactions(
  branchId: string,
  filters?: { status?: string; from?: string; to?: string; page?: number; limit?: number }
): Promise<{ data: ITransaction[]; total: number }> {
  const query: any = { branchId }
  if (filters?.status) query.status = filters.status
  if (filters?.from || filters?.to) {
    query.createdAt = {}
    if (filters.from) query.createdAt.$gte = new Date(filters.from)
    if (filters.to) query.createdAt.$lte = new Date(filters.to)
  }

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 50
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(query)
  ])

  return { data: data.map(toShared), total }
}
