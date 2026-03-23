// src/main/handlers/cash-drawer.handlers.ts
import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import { openDrawer, closeDrawer, getOpenDrawer, getDrawers } from '../services/cash-drawer.service'

export function registerCashDrawerHandlers(): void {

  ipcMain.handle(IPC.DRAWER_OPEN, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_open_close_drawer')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { openingCash: number }
      if (typeof r?.openingCash !== 'number' || r.openingCash < 0) {
        return { success: false, error: 'Opening cash must be a non-negative number' }
      }
      const terminalId = store.get('terminalId') ?? 'unknown'
      const data = await openDrawer({ openingCash: r.openingCash }, auth.user._id, auth.user.branchId, terminalId)
      return { success: true, data }
    } catch (err: any) {
      // Mongo duplicate key on partial unique index → drawer already open
      if (err.code === 11000) {
        return { success: false, error: 'A drawer is already open on this terminal' }
      }
      return { success: false, error: err.message ?? 'Failed to open drawer' }
    }
  })

  ipcMain.handle(IPC.DRAWER_CLOSE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_open_close_drawer')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { closingCash: number }
      if (typeof r?.closingCash !== 'number' || r.closingCash < 0) {
        return { success: false, error: 'Closing cash must be a non-negative number' }
      }
      const terminalId = store.get('terminalId') ?? 'unknown'
      const data = await closeDrawer({ closingCash: r.closingCash }, auth.user._id, auth.user.branchId, terminalId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to close drawer' }
    }
  })

  ipcMain.handle(IPC.DRAWER_GET_OPEN, async () => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const terminalId = store.get('terminalId') ?? 'unknown'
      const data = await getOpenDrawer(terminalId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to get open drawer' }
    }
  })

  ipcMain.handle(IPC.DRAWER_GET_ALL, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      const canViewAll = auth.role.permissions.includes('can_view_all_branches')
      const r = (req ?? {}) as { limit?: number; skip?: number }
      const branchId = canViewAll ? null : auth.user.branchId
      const result = await getDrawers(branchId, r)
      return { success: true, ...result }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to get drawers' }
    }
  })
}
