// src/main/handlers/supplier.handlers.ts
import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
  getSupplierWithStats
} from '../services/supplier.service'

export function registerSupplierHandlers(): void {
  ipcMain.handle(IPC.SUPPLIERS_GET_ALL, async (_e, req: unknown) => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const r = req as { includeInactive?: boolean } | undefined
      const data = await getAllSuppliers(r?.includeInactive ?? false)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load suppliers' }
    }
  })

  ipcMain.handle(IPC.SUPPLIERS_GET_BY_ID, async (_e, req: unknown) => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const r = req as { id: string; withStats?: boolean }
      if (!r?.id) return { success: false, error: 'ID is required' }
      if (r.withStats) {
        const data = await getSupplierWithStats(r.id)
        if (!data) return { success: false, error: 'Supplier not found' }
        return { success: true, data }
      }
      const data = await getSupplierById(r.id)
      if (!data) return { success: false, error: 'Supplier not found' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load supplier' }
    }
  })

  ipcMain.handle(IPC.SUPPLIERS_CREATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_suppliers')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as any
      if (!r?.name?.trim()) return { success: false, error: 'Name is required' }
      const data = await createSupplier(r)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to create supplier' }
    }
  })

  ipcMain.handle(IPC.SUPPLIERS_UPDATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_suppliers')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string; input: any }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await updateSupplier(r.id, r.input)
      if (!data) return { success: false, error: 'Supplier not found' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to update supplier' }
    }
  })

  ipcMain.handle(IPC.SUPPLIERS_DEACTIVATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_suppliers')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await deactivateSupplier(r.id)
      if (!data) return { success: false, error: 'Supplier not found' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to deactivate supplier' }
    }
  })
}
