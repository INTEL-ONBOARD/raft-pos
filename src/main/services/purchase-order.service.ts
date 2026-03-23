// src/main/services/purchase-order.service.ts
import mongoose from 'mongoose'
import { PurchaseOrder } from '../models/purchase-order.model'
import { Inventory } from '../models/inventory.model'
import { StockAdjustment } from '../models/stock-adjustment.model'
import { Counter } from '../models/counter.model'
import type { CreatePOInput, UpdatePOInput, ReceivePOInput, IPurchaseOrder } from '@shared/types/purchase-order.types'

function toShared(doc: any): IPurchaseOrder {
  return {
    _id: doc._id.toString(),
    poNumber: doc.poNumber,
    supplierId: doc.supplierId.toString(),
    branchId: doc.branchId.toString(),
    items: doc.items.map((it: any) => ({
      productId: it.productId.toString(),
      sku: it.sku, name: it.name, unit: it.unit,
      orderedQty: it.orderedQty,
      receivedQty: it.receivedQty,
      receiveHistory: it.receiveHistory.map((h: any) => ({
        qty: h.qty,
        receivedAt: h.receivedAt.toISOString(),
        receivedBy: h.receivedBy.toString(),
        notes: h.notes
      })),
      unitCost: it.unitCost,
      totalCost: it.totalCost
    })),
    status: doc.status,
    subtotal: doc.subtotal,
    totalAmount: doc.totalAmount,
    notes: doc.notes,
    createdBy: doc.createdBy.toString(),
    createdAt: doc.createdAt.toISOString(),
    sentAt: doc.sentAt?.toISOString() ?? null,
    receivedAt: doc.receivedAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt.toISOString()
  }
}

async function generatePoNumber(): Promise<string> {
  const date = new Date()
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const key = `po_${ymd}`
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  )
  if (!counter) throw new Error('Failed to generate PO number')
  return `PO-${ymd}-${String(counter.seq).padStart(4, '0')}`
}

export async function createPO(input: CreatePOInput, userId: string, branchId: string): Promise<IPurchaseOrder> {
  const poNumber = await generatePoNumber()
  const items = input.items.map(it => ({
    ...it,
    receivedQty: 0,
    receiveHistory: [],
    totalCost: it.unitCost * it.orderedQty
  }))
  const subtotal = items.reduce((s, it) => s + it.totalCost, 0)
  const po = await PurchaseOrder.create({
    poNumber,
    supplierId: input.supplierId,
    branchId,
    items,
    status: 'draft',
    subtotal,
    totalAmount: subtotal,
    notes: input.notes ?? '',
    createdBy: userId
  })
  return toShared(po)
}

export async function updatePO(id: string, input: UpdatePOInput): Promise<IPurchaseOrder | null> {
  const po = await PurchaseOrder.findById(id)
  if (!po) return null
  if (po.status !== 'draft') throw new Error('Only draft POs can be edited')

  const updates: any = {}
  if (input.supplierId) updates.supplierId = input.supplierId
  if (input.notes !== undefined) updates.notes = input.notes
  if (input.items) {
    const items = input.items.map(it => ({
      ...it,
      receivedQty: 0,
      receiveHistory: [],
      totalCost: it.unitCost * it.orderedQty
    }))
    updates.items = items
    updates.subtotal = items.reduce((s, it) => s + it.totalCost, 0)
    updates.totalAmount = updates.subtotal
  }
  const updated = await PurchaseOrder.findByIdAndUpdate(id, { $set: updates }, { new: true })
  return updated ? toShared(updated) : null
}

export async function sendPO(id: string): Promise<IPurchaseOrder | null> {
  const updated = await PurchaseOrder.findOneAndUpdate(
    { _id: id, status: 'draft' },
    { status: 'sent', sentAt: new Date() },
    { new: true }
  )
  return updated ? toShared(updated) : null
}

export async function cancelPO(id: string): Promise<IPurchaseOrder | null> {
  const updated = await PurchaseOrder.findOneAndUpdate(
    { _id: id, status: { $in: ['draft', 'sent'] } },
    { status: 'cancelled' },
    { new: true }
  )
  return updated ? toShared(updated) : null
}

export async function receivePO(input: ReceivePOInput, userId: string, branchId: string): Promise<IPurchaseOrder> {
  const session = await mongoose.startSession()
  let result: IPurchaseOrder | undefined

  await session.withTransaction(async () => {
    const po = await PurchaseOrder.findById(input.poId).session(session)
    if (!po) throw new Error('Purchase order not found')
    if (!['sent', 'partial'].includes(po.status)) throw new Error('PO must be in sent or partial status to receive')
    if (po.branchId.toString() !== branchId) throw new Error('PO belongs to a different branch')

    const now = new Date()

    for (const receiveItem of input.items) {
      const poItem = (po.items as any[]).find(
        (it: any) => it.productId.toString() === receiveItem.productId
      )
      if (!poItem) throw new Error(`Product ${receiveItem.productId} not in this PO`)
      if (receiveItem.qty <= 0) throw new Error('Receive quantity must be greater than 0')

      const remaining = poItem.orderedQty - poItem.receivedQty
      if (receiveItem.qty > remaining) {
        throw new Error(`Cannot receive ${receiveItem.qty} of "${poItem.name}" — only ${remaining} remaining`)
      }

      // Append to receiveHistory + increment receivedQty on the embedded item
      poItem.receiveHistory.push({
        qty: receiveItem.qty,
        receivedAt: now,
        receivedBy: userId,
        notes: receiveItem.notes ?? ''
      })
      poItem.receivedQty += receiveItem.qty

      // Upsert inventory record for this branch (creates it if it doesn't exist)
      const prevInv = await Inventory.findOne({ productId: receiveItem.productId, branchId }).session(session).lean()
      const previousStock = prevInv?.quantity ?? 0
      await Inventory.findOneAndUpdate(
        { productId: receiveItem.productId, branchId },
        { $inc: { quantity: receiveItem.qty } },
        { upsert: true, new: true, session }
      )
      const newStock = previousStock + receiveItem.qty

      // Create stock adjustment record
      await StockAdjustment.create([{
        branchId,
        productId: receiveItem.productId,
        type: 'purchase_received',
        quantity: receiveItem.qty,
        previousStock,
        newStock,
        reason: `PO Receive: ${po.poNumber}`,
        notes: receiveItem.notes ?? '',
        createdBy: userId,
        purchaseOrderId: po._id
      }], { session })
    }

    // Compute new status
    const allReceived = (po.items as any[]).every(
      (it: any) => it.receivedQty >= it.orderedQty
    )
    const anyReceived = (po.items as any[]).some((it: any) => it.receivedQty > 0)
    const newStatus = allReceived ? 'received' : anyReceived ? 'partial' : po.status

    po.status = newStatus as any
    if (newStatus === 'received') po.receivedAt = now

    await po.save({ session })
    result = toShared(po)
  })

  await session.endSession()

  if (!result) throw new Error('Receive transaction failed')
  return result
}

export async function getPO(id: string): Promise<IPurchaseOrder | null> {
  const po = await PurchaseOrder.findById(id).lean()
  return po ? toShared(po) : null
}

export async function getPOs(filters: {
  branchId?: string | null
  supplierId?: string
  status?: string
  limit?: number
  skip?: number
}): Promise<{ data: IPurchaseOrder[]; total: number }> {
  const query: any = {}
  if (filters.branchId) query.branchId = filters.branchId
  if (filters.supplierId) query.supplierId = filters.supplierId
  if (filters.status) query.status = filters.status

  const [data, total] = await Promise.all([
    PurchaseOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(filters.skip ?? 0)
      .limit(filters.limit ?? 100)
      .lean(),
    PurchaseOrder.countDocuments(query)
  ])
  return { data: data.map(toShared), total }
}
