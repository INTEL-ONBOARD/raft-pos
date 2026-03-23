// src/main/services/role.service.ts
import { Role } from '../models/role.model'
import { User } from '../models/user.model'
import type { IPublicRole, CreateRoleInput, UpdateRoleInput } from '@shared/types/role.types'

function toShared(doc: any): IPublicRole {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    permissions: doc.permissions,
    maxDiscountPercent: doc.maxDiscountPercent,
    requiresSupervisorOverride: doc.requiresSupervisorOverride,
    createdAt: doc.createdAt.toISOString()
  }
}

export async function getRoles(): Promise<IPublicRole[]> {
  const docs = await Role.find().sort({ name: 1 }).lean()
  return docs.map(toShared)
}

export async function getRoleById(id: string): Promise<IPublicRole | null> {
  const doc = await Role.findById(id).lean()
  return doc ? toShared(doc) : null
}

export async function createRole(input: CreateRoleInput): Promise<IPublicRole> {
  const doc = await Role.create({
    name: input.name.trim(),
    permissions: input.permissions,
    maxDiscountPercent: input.maxDiscountPercent,
    requiresSupervisorOverride: input.requiresSupervisorOverride
  })
  return toShared(doc)
}

export async function updateRole(id: string, input: UpdateRoleInput): Promise<IPublicRole | null> {
  const updates: any = {}
  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.permissions !== undefined) updates.permissions = input.permissions
  if (input.maxDiscountPercent !== undefined) updates.maxDiscountPercent = input.maxDiscountPercent
  if (input.requiresSupervisorOverride !== undefined) updates.requiresSupervisorOverride = input.requiresSupervisorOverride
  const doc = await Role.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean()
  return doc ? toShared(doc) : null
}

export async function deleteRole(id: string): Promise<{ deleted: boolean; reason?: string }> {
  const activeUsers = await User.countDocuments({ roleId: id, isActive: true })
  if (activeUsers > 0) {
    return { deleted: false, reason: `Cannot delete: ${activeUsers} active user(s) assigned to this role` }
  }
  await Role.findByIdAndDelete(id)
  return { deleted: true }
}
