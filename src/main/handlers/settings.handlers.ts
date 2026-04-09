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
      if (!auth.role.permissions.includes('can_manage_settings'))
        return { success: false, error: 'Permission denied' }
      const r = req as {
        storeName?: string
        receiptHeader?: string
        receiptFooter?: string
        globalTaxRate?: number
        currencySymbol?: string
        lowStockDefaultThreshold?: number
        terminalId?: string
      }
      const MAX_LEN = { storeName: 100, receiptHeader: 500, receiptFooter: 500, currencySymbol: 5 }
      if (typeof r?.storeName === 'string' && r.storeName.trim().length > MAX_LEN.storeName) {
        return {
          success: false,
          error: `Store name must be ${MAX_LEN.storeName} characters or fewer`
        }
      }
      if (typeof r?.storeName === 'string' && r.storeName.trim().length === 0) {
        return { success: false, error: 'Store name cannot be empty' }
      }
      if (typeof r?.receiptHeader === 'string' && r.receiptHeader.length > MAX_LEN.receiptHeader) {
        return {
          success: false,
          error: `Receipt header must be ${MAX_LEN.receiptHeader} characters or fewer`
        }
      }
      if (typeof r?.receiptFooter === 'string' && r.receiptFooter.length > MAX_LEN.receiptFooter) {
        return {
          success: false,
          error: `Receipt footer must be ${MAX_LEN.receiptFooter} characters or fewer`
        }
      }
      if (
        typeof r?.currencySymbol === 'string' &&
        r.currencySymbol.trim().length > MAX_LEN.currencySymbol
      ) {
        return {
          success: false,
          error: `Currency symbol must be ${MAX_LEN.currencySymbol} characters or fewer`
        }
      }
      if (typeof r?.globalTaxRate === 'number' && (r.globalTaxRate < 0 || r.globalTaxRate > 100)) {
        return { success: false, error: 'Tax rate must be between 0 and 100' }
      }
      // terminalId is a local store value — validate it's a non-empty string if provided
      let terminalId: string | undefined
      if (r?.terminalId !== undefined) {
        const trimmed = typeof r.terminalId === 'string' ? r.terminalId.trim() : ''
        if (!trimmed) {
          return { success: false, error: 'Terminal ID cannot be empty' }
        }
        terminalId = trimmed
      }
      const data = await updateSettings(r, terminalId)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to update settings' }
    }
  })
}
