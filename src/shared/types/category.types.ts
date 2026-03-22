export interface ICategory {
  _id: string
  name: string
  parentId: string | null
  order: number
  isActive: boolean
}

export interface CategoryTree extends ICategory {
  children: CategoryTree[]
}

export type CategoryResult =
  | { success: true; data: ICategory }
  | { success: false; error: string }

export type CategoriesResult =
  | { success: true; data: ICategory[] }
  | { success: false; error: string }
