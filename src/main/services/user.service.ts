// src/main/services/user.service.ts
import bcrypt from 'bcryptjs'
import { User } from '../models/user.model'
import { Session } from '../models/session.model'
import { ActivityLog } from '../models/activity-log.model'
import store from '../store/electron-store'
import type { IPublicUser, CreateUserInput, UpdateUserInput, ActivityLogEntry } from '@shared/types/user.types'

function toShared(doc: any): IPublicUser {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    roleId: doc.roleId.toString(),
    branchId: doc.branchId.toString(),
    isActive: doc.isActive,
    lastLogin: doc.lastLogin ? new Date(doc.lastLogin).getTime() : null,
    createdAt: doc.createdAt.toISOString()
  }
}

export async function getUsers(branchId: string | null): Promise<{ data: IPublicUser[]; total: number }> {
  const query: any = {}
  if (branchId) query.branchId = branchId
  const docs = await User.find(query).sort({ name: 1 }).lean()
  return { data: docs.map(toShared), total: docs.length }
}

export async function getUserById(id: string): Promise<IPublicUser | null> {
  const doc = await User.findById(id).lean()
  return doc ? toShared(doc) : null
}

export async function createUser(input: CreateUserInput, createdById: string, branchId: string): Promise<IPublicUser> {
  const passwordHash = await bcrypt.hash(input.password, 12)
  let supervisorPin: string | null = null
  if (input.supervisorPin) {
    supervisorPin = await bcrypt.hash(input.supervisorPin, 12)
  }
  const doc = await User.create({
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    passwordHash,
    supervisorPin,
    roleId: input.roleId,
    branchId: input.branchId,
    isActive: true
  })
  const terminalId = store.get('terminalId') ?? 'unknown'
  await ActivityLog.create({
    userId: createdById,
    branchId,
    terminalId,
    action: 'user_created',
    targetId: doc._id,
    targetCollection: 'users',
    metadata: { name: doc.name, email: doc.email }
  }).catch(() => {})
  return toShared(doc)
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<IPublicUser | null> {
  const updates: any = {}
  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.email !== undefined) updates.email = input.email.toLowerCase().trim()
  if (input.roleId !== undefined) updates.roleId = input.roleId
  if (input.branchId !== undefined) updates.branchId = input.branchId
  if (input.isActive !== undefined) updates.isActive = input.isActive
  if (input.password) updates.passwordHash = await bcrypt.hash(input.password, 12)
  if (input.supervisorPin !== undefined) {
    updates.supervisorPin = input.supervisorPin ? await bcrypt.hash(input.supervisorPin, 12) : null
  }
  const doc = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean()
  return doc ? toShared(doc) : null
}

export async function deactivateUser(id: string): Promise<IPublicUser | null> {
  const doc = await User.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean()
  return doc ? toShared(doc) : null
}

export async function forceLogout(userId: string): Promise<void> {
  await Session.updateMany(
    { userId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  )
}

export async function getUserActivity(userId: string, limit = 50): Promise<ActivityLogEntry[]> {
  const docs = await ActivityLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
  return docs.map((d: any) => ({
    _id: d._id.toString(),
    action: d.action,
    targetId: d.targetId?.toString() ?? null,
    targetCollection: d.targetCollection ?? null,
    metadata: d.metadata ?? {},
    createdAt: d.createdAt.toISOString()
  }))
}
