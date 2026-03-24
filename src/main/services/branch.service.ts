import { Branch } from '../models/branch.model'

export interface IBranchPublic {
  _id: string
  name: string
  code: string
  address: string
  phone: string
  email: string
  isActive: boolean
}

export interface CreateBranchInput {
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
}

export interface UpdateBranchInput {
  name?: string
  code?: string
  address?: string
  phone?: string
  email?: string
}

function toPublic(doc: any): IBranchPublic {
  return {
    _id: doc._id?.toString() ?? '',
    name: doc.name ?? '',
    code: doc.code ?? '',
    address: doc.address ?? '',
    phone: doc.phone ?? '',
    email: doc.email ?? '',
    isActive: doc.isActive ?? true,
  }
}

export async function getBranches(): Promise<IBranchPublic[]> {
  const docs = await Branch.find({}).sort({ name: 1 }).lean()
  return docs.map(toPublic)
}

export async function createBranch(input: CreateBranchInput): Promise<IBranchPublic> {
  const doc = await Branch.create({
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    address: input.address?.trim() ?? '',
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    isActive: true,
  })
  return toPublic(doc)
}

export async function updateBranch(id: string, input: UpdateBranchInput): Promise<IBranchPublic | null> {
  const updates: any = {}
  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.code !== undefined) updates.code = input.code.trim().toUpperCase()
  if (input.address !== undefined) updates.address = input.address.trim()
  if (input.phone !== undefined) updates.phone = input.phone.trim()
  if (input.email !== undefined) updates.email = input.email.trim()
  const doc = await Branch.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean()
  return doc ? toPublic(doc) : null
}

export async function deactivateBranch(id: string): Promise<IBranchPublic | null> {
  const doc = await Branch.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean()
  return doc ? toPublic(doc) : null
}
