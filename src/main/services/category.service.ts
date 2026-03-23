import { Category } from '../models/category.model'
import type { ICategory as SharedCategory } from '@shared/types/category.types'

async function getCategoryDepth(categoryId: string | null): Promise<number> {
  if (!categoryId) return 0
  let depth = 0
  let current: string | null = categoryId
  while (current) {
    const cat = await Category.findById(current).lean()
    if (!cat) break
    depth++
    current = cat.parentId ? cat.parentId.toString() : null
  }
  return depth
}

function toShared(doc: any): SharedCategory {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    parentId: doc.parentId ? doc.parentId.toString() : null,
    order: doc.order,
    isActive: doc.isActive
  }
}

export async function getAllCategories(): Promise<SharedCategory[]> {
  const cats = await Category.find().sort({ order: 1, name: 1 }).lean()
  return cats.map(toShared)
}

export async function createCategory(data: {
  name: string
  parentId?: string | null
  order?: number
}): Promise<SharedCategory> {
  if (data.parentId) {
    const parentDepth = await getCategoryDepth(data.parentId)
    if (parentDepth >= 2) {
      throw new Error('Categories support a maximum of 3 levels. This parent is already at the maximum depth.')
    }
  }
  const cat = await Category.create({
    name: data.name,
    parentId: data.parentId ?? null,
    order: data.order ?? 0,
    isActive: true
  })
  return toShared(cat)
}

export async function updateCategory(
  id: string,
  data: { name?: string; parentId?: string | null; order?: number; isActive?: boolean }
): Promise<SharedCategory | null> {
  if (data.parentId) {
    const parentDepth = await getCategoryDepth(data.parentId)
    if (parentDepth >= 2) {
      throw new Error('Categories support a maximum of 3 levels. This parent is already at the maximum depth.')
    }
  }
  const cat = await Category.findByIdAndUpdate(id, { $set: data }, { new: true }).lean()
  return cat ? toShared(cat) : null
}

export async function deleteCategory(id: string): Promise<boolean> {
  // Prevent deleting if it has children
  const childCount = await Category.countDocuments({ parentId: id })
  if (childCount > 0) throw new Error('Cannot delete category with subcategories')
  const result = await Category.findByIdAndDelete(id)
  return result !== null
}
