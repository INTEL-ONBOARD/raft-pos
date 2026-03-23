// src/main/handlers/settings.handlers.ts
import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import { getSettings, updateSettings } from '../services/settings.service'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.SETTINGS_GET, async () => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const data = await getSettings()
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load settings' }
    }
  })

  ipcMain.handle(IPC.SETTINGS_UPDATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_settings')) return { success: false, error: 'Permission denied' }
      const r = req as {
        storeName?: string
        receiptHeader?: string
        receiptFooter?: string
        globalTaxRate?: number
        currencySymbol?: string
        lowStockDefaultThreshold?: number
        terminalId?: string
      }
      // terminalId is a local store value — validate it's a non-empty string if provided
      const terminalId = typeof r?.terminalId === 'string' && r.terminalId.trim()
        ? r.terminalId.trim()
        : undefined
      const data = await updateSettings(r, terminalId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to update settings' }
    }
  })
}
