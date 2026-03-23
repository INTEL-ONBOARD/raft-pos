// src/main/handlers/dashboard.handlers.ts
import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import { getDashboardStats } from '../services/dashboard.service'

export function registerDashboardHandlers(): void {
  ipcMain.handle(IPC.DASHBOARD_GET_STATS, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      const canViewAll = auth.role.permissions.includes('can_view_all_branches')
      const r = (req ?? {}) as { branchId?: string }
      // Allow branch override only for users with can_view_all_branches
      const branchId = canViewAll && r.branchId ? r.branchId : auth.user.branchId
      const data = await getDashboardStats(branchId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load dashboard stats' }
    }
  })
}
