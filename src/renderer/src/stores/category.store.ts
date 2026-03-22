import { create } from 'zustand'
import type { ICategory, CategoryTree } from '@shared/types/category.types'

function buildTree(cats: ICategory[], parentId: string | null = null): CategoryTree[] {
  return cats
    .filter(c => c.parentId === parentId && c.isActive)
    .sort((a, b) => a.order - b.order)
    .map(c => ({ ...c, children: buildTree(cats, c._id) }))
}

interface CategoryState {
  categories: ICategory[]
  setCategories: (cats: ICategory[]) => void
  getTree: () => CategoryTree[]
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  setCategories: (cats) => set({ categories: cats }),
  getTree: () => buildTree(get().categories)
}))
