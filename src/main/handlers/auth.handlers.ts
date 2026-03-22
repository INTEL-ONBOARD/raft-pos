import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { login, logout, validateSession } from '../services/auth.service'
import store from '../store/electron-store'

export function registerAuthHandlers(): void {
  // Login
  ipcMain.handle(IPC.AUTH_LOGIN, async (_event, req: unknown) => {
    // Runtime validation at the IPC boundary
    const r = req as Record<string, unknown>
    if (
      typeof req !== 'object' ||
      req === null ||
      typeof r.email !== 'string' ||
      typeof r.password !== 'string' ||
      r.email.trim().length === 0 ||
      r.password.length === 0
    ) {
      return { success: false, error: 'Invalid request payload' }
    }
    try {
      return await login(req as { email: string; password: string })
    } catch (err) {
      console.error('[IPC] AUTH_LOGIN error:', err)
      return { success: false, error: 'An internal error occurred. Please try again.' }
    }
  })

  // Logout
  ipcMain.handle(IPC.AUTH_LOGOUT, async () => {
    try {
      const token = store.get('jwt')
      if (token) await logout(token)
      return { success: true }
    } catch (err) {
      console.error('[IPC] AUTH_LOGOUT error:', err)
      return { success: false }
    }
  })

  // Validate persisted session on app start
  ipcMain.handle(IPC.AUTH_VALIDATE_SESSION, async () => {
    try {
      const token = store.get('jwt')
      if (!token) return { valid: false, reason: 'not_found' }
      return validateSession(token)
    } catch (err) {
      console.error('[IPC] AUTH_VALIDATE_SESSION error:', err)
      return { valid: false, reason: 'not_found' }
    }
  })

  // Get current user (re-validates session on-demand mid-session)
  ipcMain.handle(IPC.AUTH_ME, async () => {
    try {
      const token = store.get('jwt')
      if (!token) return { valid: false, reason: 'not_found' }
      return validateSession(token)
    } catch (err) {
      console.error('[IPC] AUTH_ME error:', err)
      return { valid: false, reason: 'not_found' }
    }
  })
}
