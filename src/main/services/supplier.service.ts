// src/main/services/supplier.service.ts
import { Supplier } from '../models/supplier.model'
import { PurchaseOrder } from '../models/purchase-order.model'
import type { ISupplier as ISupplierShared, CreateSupplierInput, UpdateSupplierInput } from '@shared/types/supplier.types'

function toShared(doc: any): ISupplierShared {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    contactPerson: doc.contactPerson,
    phone: doc.phone,
    email: doc.email,
    address: doc.address,
    notes: doc.notes,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString()
  }
}

export async function getAllSuppliers(includeInactive = false): Promise<ISupplierShared[]> {
  const query = includeInactive ? {} : { isActive: true }
  const docs = await Supplier.find(query).sort({ name: 1 }).lean()
  return docs.map(toShared)
}

export async function getSupplierById(id: string): Promise<ISupplierShared | null> {
  const doc = await Supplier.findById(id).lean()
  return doc ? toShared(doc) : null
}

export async function createSupplier(input: CreateSupplierInput): Promise<ISupplierShared> {
  const doc = await Supplier.create({
    name: input.name.trim(),
    contactPerson: input.contactPerson ?? '',
    phone: input.phone ?? '',
    email: input.email ?? '',
    address: input.address ?? '',
    notes: input.notes ?? ''
  })
  return toShared(doc)
}

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<ISupplierShared | null> {
  const updates: any = {}
  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.contactPerson !== undefined) updates.contactPerson = input.contactPerson
  if (input.phone !== undefined) updates.phone = input.phone
  if (input.email !== undefined) updates.email = input.email
  if (input.address !== undefined) updates.address = input.address
  if (input.notes !== undefined) updates.notes = input.notes
  if (input.isActive !== undefined) updates.isActive = input.isActive

  const doc = await Supplier.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean()
  return doc ? toShared(doc) : null
}

export async function deactivateSupplier(id: string): Promise<ISupplierShared | null> {
  const doc = await Supplier.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean()
  return doc ? toShared(doc) : null
}

export async function getSupplierWithStats(id: string) {
  const supplier = await Supplier.findById(id).lean()
  if (!supplier) return null

  const [aggResult] = await PurchaseOrder.aggregate([
    { $match: { supplierId: supplier._id, status: { $ne: 'cancelled' } } },
    {
      $facet: {
        stats: [
          {
            $group: {
              _id: null,
              totalSpend: { $sum: '$totalAmount' },
              orderCount: { $sum: 1 }
            }
          }
        ],
        recentOrders: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          { $project: { poNumber: 1, status: 1, totalAmount: 1, createdAt: 1 } }
        ]
      }
    }
  ])

  const stats = aggResult?.stats[0] ?? { totalSpend: 0, orderCount: 0 }
  const recentOrders = (aggResult?.recentOrders ?? []).map((o: any) => ({
    _id: o._id.toString(),
    poNumber: o.poNumber,
    status: o.status,
    totalAmount: o.totalAmount,
    createdAt: o.createdAt.toISOString()
  }))

  return {
    supplier: {
      _id: supplier._id.toString(),
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      notes: supplier.notes,
      isActive: supplier.isActive,
      createdAt: (supplier as any).createdAt?.toISOString() ?? ''
    },
    totalSpend: stats.totalSpend,
    orderCount: stats.orderCount,
    recentOrders
  }
}
