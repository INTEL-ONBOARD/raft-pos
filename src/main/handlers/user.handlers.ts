// src/main/handlers/user.handlers.ts
import { ipcMain, webContents } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import {
  getUsers, getUserById, createUser, updateUser, deactivateUser, forceLogout, getUserActivity
} from '../services/user.service'

export function registerUserHandlers(): void {
  ipcMain.handle(IPC.USERS_GET_ALL, async () => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_users')) return { success: false, error: 'Permission denied' }
      const canViewAll = auth.role.permissions.includes('can_view_all_branches')
      const branchId = canViewAll ? null : auth.user.branchId
      return { success: true, ...(await getUsers(branchId)) }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load users' }
    }
  })

  ipcMain.handle(IPC.USERS_GET_BY_ID, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_users')) return { success: false, error: 'Permission denied' }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await getUserById(r.id)
      if (!data) return { success: false, error: 'User not found' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load user' }
    }
  })

  ipcMain.handle(IPC.USERS_CREATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_users')) return { success: false, error: 'Permission denied' }
      const r = req as any
      if (!r?.name) return { success: false, error: 'Name is required' }
      if (!r?.email) return { success: false, error: 'Email is required' }
      if (!r?.password || r.password.length < 6) return { success: false, error: 'Password must be at least 6 characters' }
      if (!r?.roleId) return { success: false, error: 'Role is required' }
      if (!r?.branchId) return { success: false, error: 'Branch is required' }
      const data = await createUser(r, auth.user._id, auth.user.branchId)
      return { success: true, data }
    } catch (err: any) {
      if ((err as any).code === 11000) return { success: false, error: 'A user with this email already exists' }
      return { success: false, error: err.message ?? 'Failed to create user' }
    }
  })

  ipcMain.handle(IPC.USERS_UPDATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_users')) return { success: false, error: 'Permission denied' }
      const r = req as { id: string; input: any }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await updateUser(r.id, r.input)
      if (!data) return { success: false, error: 'User not found' }
      return { success: true, data }
    } catch (err: any) {
      if ((err as any).code === 11000) return { success: false, error: 'A user with this email already exists' }
      return { success: false, error: err.message ?? 'Failed to update user' }
    }
  })

  ipcMain.handle(IPC.USERS_DEACTIVATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_users')) return { success: false, error: 'Permission denied' }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await deactivateUser(r.id)
      if (!data) return { success: false, error: 'User not found' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to deactivate user' }
    }
  })

  ipcMain.handle(IPC.USERS_FORCE_LOGOUT, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_users')) return { success: false, error: 'Permission denied' }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      await forceLogout(r.id)
      webContents.getAllWebContents().forEach(wc => wc.send(IPC.AUTH_SESSION_REVOKED))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to force logout' }
    }
  })

  ipcMain.handle(IPC.USERS_GET_ACTIVITY, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_users')) return { success: false, error: 'Permission denied' }
      const r = req as { id: string; limit?: number }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await getUserActivity(r.id, r.limit)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load activity' }
    }
  })
}
