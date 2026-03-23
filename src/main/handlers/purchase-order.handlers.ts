// src/main/handlers/purchase-order.handlers.ts
import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import {
  createPO, updatePO, sendPO, receivePO, cancelPO, getPO, getPOs
} from '../services/purchase-order.service'

export function registerPurchaseOrderHandlers(): void {
  ipcMain.handle(IPC.PO_GET_ALL, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      const isAdmin = auth.role.permissions.includes('can_manage_purchase_orders')
      const canViewAll = auth.role.permissions.includes('can_view_all_branches')
      if (!isAdmin) return { success: false, error: 'Permission denied' }

      const r = req as { supplierId?: string; status?: string; limit?: number; skip?: number } | undefined
      const branchId = canViewAll ? null : auth.user.branchId
      const result = await getPOs({
        branchId,
        supplierId: r?.supplierId,
        status: r?.status,
        limit: r?.limit,
        skip: r?.skip
      })
      return { success: true, ...result }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load purchase orders' }
    }
  })

  ipcMain.handle(IPC.PO_GET_BY_ID, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_purchase_orders')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await getPO(r.id)
      if (!data) return { success: false, error: 'Purchase order not found' }
      const canViewAll = auth.role.permissions.includes('can_view_all_branches')
      if (!canViewAll && data.branchId !== auth.user.branchId) {
        return { success: false, error: 'Purchase order not found' }
      }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load purchase order' }
    }
  })

  ipcMain.handle(IPC.PO_CREATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_purchase_orders')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as any
      if (!r?.supplierId) return { success: false, error: 'Supplier is required' }
      if (!r?.items?.length) return { success: false, error: 'At least one line item is required' }
      const data = await createPO(r, auth.user._id, auth.user.branchId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to create purchase order' }
    }
  })

  ipcMain.handle(IPC.PO_UPDATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_purchase_orders')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string; input: any }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await updatePO(r.id, r.input)
      if (!data) return { success: false, error: 'Purchase order not found or not in draft status' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to update purchase order' }
    }
  })

  ipcMain.handle(IPC.PO_SEND, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_purchase_orders')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await sendPO(r.id)
      if (!data) return { success: false, error: 'Purchase order not found or not in draft status' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to send purchase order' }
    }
  })

  ipcMain.handle(IPC.PO_RECEIVE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_purchase_orders')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as any
      if (!r?.poId) return { success: false, error: 'PO ID is required' }
      if (!r?.items?.length) return { success: false, error: 'At least one receive item is required' }
      const data = await receivePO(r, auth.user._id, auth.user.branchId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to receive purchase order' }
    }
  })

  ipcMain.handle(IPC.PO_CANCEL, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_purchase_orders')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await cancelPO(r.id)
      if (!data) return { success: false, error: 'Purchase order not found or cannot be cancelled in its current status' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to cancel purchase order' }
    }
  })
}
