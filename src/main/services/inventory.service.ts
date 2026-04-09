import mongoose from 'mongoose'
import { Inventory } from '../models/inventory.model'
import { StockAdjustment } from '../models/stock-adjustment.model'
import { ActivityLog } from '../models/activity-log.model'
import store from '../store/electron-store'
import type {
  StockLevelRow,
  ManualAdjustmentInput,
  IStockAdjustment
} from '@shared/types/inventory.types'

// branchId = null means "all branches" (for users with can_view_all_branches)
export async function getStockLevels(branchId: string | null): Promise<StockLevelRow[]> {
  const filter = branchId ? { branchId } : {}
  const inventories = await Inventory.find(filter)
    .populate<{
      productId: {
        _id: mongoose.Types.ObjectId
        name: string
        sku: string
        unit: string
        isActive: boolean
      }
    }>({
      path: 'productId',
      select: 'name sku unit isActive',
      match: { isActive: true }
    })
    .lean()

  // After populate with match, inactive products come back as null — filter them out
  return inventories
    .filter((inv) => inv.productId != null)
    .map((inv) => {
      const product = inv.productId as any
      return {
        _id: inv._id.toString(),
        productId: product._id.toString(),
        branchId: inv.branchId.toString(),
        quantity: inv.quantity,
        lowStockThreshold: inv.lowStockThreshold,
        reorderPoint: inv.reorderPoint,
        productName: product.name,
        productSku: product.sku,
        productUnit: product.unit,
        isLowStock: inv.quantity <= inv.lowStockThreshold
      }
    })
}

export async function manualAdjustment(
  input: ManualAdjustmentInput,
  branchId: string,
  userId: string
): Promise<IStockAdjustment> {
  const { productId, type, quantity, reason, notes } = input

  const session = await mongoose.startSession()
  let adj: any
  let previousStock = 0
  let newStock = 0

  try {
    await session.withTransaction(async () => {
      const current = await Inventory.findOne({ productId, branchId }).session(session).lean()
      if (!current) throw new Error('No inventory record found for this product at this branch')
      previousStock = current.quantity

      let updatedInventory: any

      if (type === 'in') {
        updatedInventory = await Inventory.findOneAndUpdate(
          { productId, branchId },
          { $inc: { quantity: quantity } },
          { new: true, runValidators: true, session }
        )
        if (!updatedInventory) throw new Error('Inventory record not found')
        newStock = updatedInventory.quantity
      } else if (type === 'out') {
        updatedInventory = await Inventory.findOneAndUpdate(
          { productId, branchId, quantity: { $gte: quantity } },
          { $inc: { quantity: -quantity } },
          { new: true, runValidators: true, session }
        )
        if (!updatedInventory) throw new Error('Insufficient stock for this adjustment')
        newStock = updatedInventory.quantity
      } else {
        // adjustment = set exact quantity
        updatedInventory = await Inventory.findOneAndUpdate(
          { productId, branchId },
          { $set: { quantity: quantity } },
          { new: true, runValidators: true, session }
        )
        if (!updatedInventory) throw new Error('Inventory record not found')
        newStock = updatedInventory.quantity
      }

      const created = await StockAdjustment.create(
        [
          {
            branchId,
            productId,
            type,
            quantity,
            previousStock,
            newStock,
            reason,
            notes: notes ?? '',
            createdBy: userId
          }
        ],
        { session }
      )
      adj = created[0]
    })
  } finally {
    await session.endSession()
  }

  // Write to activity_logs (spec §3 — stock_adjustment is a tracked action)
  const terminalId = store.get('terminalId') ?? 'unknown'
  await ActivityLog.create({
    userId,
    branchId,
    terminalId,
    action: 'stock_adjustment',
    targetId: adj._id,
    targetCollection: 'stock_adjustments',
    metadata: {
      productId,
      type,
      quantity,
      previousStock,
      newStock,
      reason
    }
  }).catch((err) => {
    console.warn('[ActivityLog] Failed to write activity log:', err?.message ?? err)
  })

  return {
    _id: adj._id.toString(),
    branchId: adj.branchId.toString(),
    productId: adj.productId.toString(),
    type: adj.type as any,
    quantity: adj.quantity,
    previousStock: adj.previousStock,
    newStock: adj.newStock,
    reason: adj.reason,
    notes: adj.notes,
    createdBy: adj.createdBy.toString(),
    createdAt: adj.createdAt.toISOString()
  }
}

export async function getAdjustments(
  branchId: string,
  productId?: string,
  opts?: { limit?: number; skip?: number }
): Promise<{ data: IStockAdjustment[]; total: number }> {
  const query: any = { branchId }
  if (productId) query.productId = productId

  const [adjs, total] = await Promise.all([
    StockAdjustment.find(query)
      .sort({ createdAt: -1 })
      .skip(opts?.skip ?? 0)
      .limit(opts?.limit ?? 100)
      .lean(),
    StockAdjustment.countDocuments(query)
  ])

  return {
    data: adjs.map((a) => ({
      _id: a._id.toString(),
      branchId: a.branchId.toString(),
      productId: a.productId.toString(),
      type: a.type as any,
      quantity: a.quantity,
      previousStock: a.previousStock,
      newStock: a.newStock,
      reason: a.reason,
      notes: a.notes,
      createdBy: a.createdBy.toString(),
      createdAt: a.createdAt.toISOString()
    })),
    total
  }
}
