// src/main/handlers/role.handlers.ts
import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import { getRoles, getRoleById, createRole, updateRole, deleteRole } from '../services/role.service'

export function registerRoleHandlers(): void {
  ipcMain.handle(IPC.ROLES_GET_ALL, async () => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_roles')) return { success: false, error: 'Permission denied' }
      const data = await getRoles()
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load roles' }
    }
  })

  ipcMain.handle(IPC.ROLES_GET_BY_ID, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_roles')) return { success: false, error: 'Permission denied' }
      const r = req as { id: string }
      const data = await getRoleById(r.id)
      if (!data) return { success: false, error: 'Role not found' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load role' }
    }
  })

  ipcMain.handle(IPC.ROLES_CREATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_roles')) return { success: false, error: 'Permission denied' }
      const r = req as any
      if (!r?.name?.trim()) return { success: false, error: 'Role name is required' }
      const data = await createRole(r)
      return { success: true, data }
    } catch (err: any) {
      if ((err as any).code === 11000) return { success: false, error: 'A role with this name already exists' }
      return { success: false, error: err.message ?? 'Failed to create role' }
    }
  })

  ipcMain.handle(IPC.ROLES_UPDATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_roles')) return { success: false, error: 'Permission denied' }
      const r = req as { id: string; input: any }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await updateRole(r.id, r.input)
      if (!data) return { success: false, error: 'Role not found' }
      return { success: true, data }
    } catch (err: any) {
      if ((err as any).code === 11000) return { success: false, error: 'A role with this name already exists' }
      return { success: false, error: err.message ?? 'Failed to update role' }
    }
  })

  ipcMain.handle(IPC.ROLES_DELETE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_roles')) return { success: false, error: 'Permission denied' }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const result = await deleteRole(r.id)
      if (!result.deleted) return { success: false, error: result.reason }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to delete role' }
    }
  })
}
