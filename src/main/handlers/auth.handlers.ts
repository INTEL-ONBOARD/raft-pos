import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { login, logout, validateSession } from '../services/auth.service'
import store from '../store/electron-store'
import type { LoginRequest } from '@shared/types/auth.types'

export function registerAuthHandlers(): void {
  // Login
  ipcMain.handle(IPC.AUTH_LOGIN, async (_event, req: LoginRequest) => {
    return login(req)
  })

  // Logout
  ipcMain.handle(IPC.AUTH_LOGOUT, async () => {
    const token = store.get('jwt')
    if (token) await logout(token)
    return { success: true }
  })

  // Validate persisted session on app start
  ipcMain.handle(IPC.AUTH_VALIDATE_SESSION, async () => {
    const token = store.get('jwt')
    if (!token) return { valid: false, reason: 'not_found' }
    return validateSession(token)
  })

  // Get current user (re-validates session)
  ipcMain.handle(IPC.AUTH_ME, async () => {
    const token = store.get('jwt')
    if (!token) return { valid: false, reason: 'not_found' }
    return validateSession(token)
  })
}
