import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import { getStockLevels, manualAdjustment, getAdjustments } from '../services/inventory.service'

export function registerInventoryHandlers(): void {
  ipcMain.handle(IPC.INVENTORY_GET_STOCK_LEVELS, async () => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      // Users with can_view_all_branches see stock across all branches; others see own branch only
      const branchId = auth.role.permissions.includes('can_view_all_branches')
        ? null
        : auth.user.branchId
      const data = await getStockLevels(branchId)
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] INVENTORY_GET_STOCK_LEVELS:', err)
      return { success: false, error: err.message ?? 'Failed to load stock levels' }
    }
  })

  ipcMain.handle(IPC.INVENTORY_ADJUST, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_inventory')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { productId: string; type: string; quantity: number; reason: string; notes?: string }
      if (!r?.productId || !r?.type || r?.quantity == null || !r?.reason) {
        return { success: false, error: 'productId, type, quantity, and reason are required' }
      }
      if (!['in', 'out', 'adjustment'].includes(r.type)) {
        return { success: false, error: 'Invalid adjustment type' }
      }
      // For 'in' and 'out', quantity must be > 0. For 'adjustment' (set exact), quantity >= 0 (zeroing stock is valid)
      if (r.type !== 'adjustment' && r.quantity <= 0) {
        return { success: false, error: 'Quantity must be greater than 0' }
      }
      if (r.type === 'adjustment' && r.quantity < 0) {
        return { success: false, error: 'Quantity cannot be negative' }
      }
      const data = await manualAdjustment(
        { productId: r.productId, type: r.type as any, quantity: r.quantity, reason: r.reason, notes: r.notes },
        auth.user.branchId,
        auth.user._id
      )
      return { success: true, data }
    } catch (err: any) {
      console.error('[IPC] INVENTORY_ADJUST:', err)
      return { success: false, error: err.message ?? 'Failed to adjust stock' }
    }
  })

  ipcMain.handle(IPC.INVENTORY_GET_ADJUSTMENTS, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_inventory')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = (req ?? {}) as { productId?: string }
      const data = await getAdjustments(auth.user.branchId, r.productId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load adjustments' }
    }
  })
}
