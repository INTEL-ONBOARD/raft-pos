import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import {
  getAllProducts, getProductById, getProductByBarcode,
  createProduct, updateProduct, deactivateProduct, importProductsFromCsv
} from '../services/product.service'

export function registerProductHandlers(): void {
  ipcMain.handle(IPC.PRODUCTS_GET_ALL, async (_e, req: unknown) => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const r = (req ?? {}) as { search?: string; categoryId?: string; isActive?: boolean; limit?: number; skip?: number }
      const result = await getAllProducts(r)
      return { success: true, ...result }
    } catch (err: any) {
      console.error('[IPC] PRODUCTS_GET_ALL:', err)
      return { success: false, error: err.message ?? 'Failed to load products' }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_GET_BY_ID, async (_e, req: unknown) => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID required' }
      const data = await getProductById(r.id)
      if (!data) return { success: false, error: 'Product not found' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed' }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_GET_BY_BARCODE, async (_e, req: unknown) => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const r = req as { barcode: string }
      if (!r?.barcode) return { success: false, error: 'Barcode required' }
      const data = await getProductByBarcode(r.barcode)
      if (!data) return { success: false, error: 'Product not found' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed' }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_CREATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_products')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { input: any }
      if (!r?.input?.sku || !r?.input?.name || !r?.input?.unit) {
        return { success: false, error: 'sku, name, and unit are required' }
      }
      const data = await createProduct(r.input, auth.user.branchId)
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] PRODUCTS_CREATE:', err)
      return { success: false, error: err.message ?? 'Failed to create product' }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_UPDATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_products')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string; input: any }
      if (!r?.id) return { success: false, error: 'ID required' }
      const data = await updateProduct(r.id, r.input ?? {})
      if (!data) return { success: false, error: 'Product not found' }
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] PRODUCTS_UPDATE:', err)
      return { success: false, error: err.message ?? 'Failed to update product' }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_DEACTIVATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_products')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID required' }
      const ok = await deactivateProduct(r.id)
      if (!ok) return { success: false, error: 'Product not found' }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed' }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_IMPORT_CSV, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_products')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { rows: any[] }
      if (!Array.isArray(r?.rows) || r.rows.length === 0) {
        return { success: false, error: 'No rows provided' }
      }
      const result = await importProductsFromCsv(r.rows, auth.user.branchId)
      return { success: true, data: result }
    } catch (err: any) {
      console.error('[IPC] PRODUCTS_IMPORT_CSV:', err)
      return { success: false, error: err.message ?? 'Import failed' }
    }
  })
}
