import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import {
  getAllCategories, createCategory, updateCategory, deleteCategory
} from '../services/category.service'

export function registerCategoryHandlers(): void {
  ipcMain.handle(IPC.CATEGORIES_GET_ALL, async () => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const data = await getAllCategories()
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] CATEGORIES_GET_ALL:', err)
      return { success: false, error: err.message ?? 'Failed to load categories' }
    }
  })

  ipcMain.handle(IPC.CATEGORIES_CREATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_categories')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { name: string; parentId?: string | null; order?: number }
      if (!r?.name?.trim()) return { success: false, error: 'Name is required' }
      const data = await createCategory(r)
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] CATEGORIES_CREATE:', err)
      return { success: false, error: err.message ?? 'Failed to create category' }
    }
  })

  ipcMain.handle(IPC.CATEGORIES_UPDATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_categories')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string; data: any }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await updateCategory(r.id, r.data)
      if (!data) return { success: false, error: 'Category not found' }
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] CATEGORIES_UPDATE:', err)
      return { success: false, error: err.message ?? 'Failed to update category' }
    }
  })

  ipcMain.handle(IPC.CATEGORIES_DELETE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_categories')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const deleted = await deleteCategory(r.id)
      if (!deleted) return { success: false, error: 'Category not found' }
      return { success: true }
    } catch (err: any) {
      console.error('[IPC] CATEGORIES_DELETE:', err)
      return { success: false, error: err.message ?? 'Failed to delete category' }
    }
  })
}
