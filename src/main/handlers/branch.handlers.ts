import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import store from '../store/electron-store'
import {
  getBranches, createBranch, updateBranch, deactivateBranch,
  type CreateBranchInput, type UpdateBranchInput,
} from '../services/branch.service'

export function registerBranchHandlers(): void {
  ipcMain.handle(IPC.BRANCHES_GET_ALL, async () => {
    try {
      await requireAuth(store.get('jwt') ?? null)
      const data = await getBranches()
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to load branches' }
    }
  })

  ipcMain.handle(IPC.BRANCHES_CREATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_branches')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as CreateBranchInput
      if (!r?.name?.trim()) return { success: false, error: 'Name is required' }
      if (!r?.code?.trim()) return { success: false, error: 'Code is required' }
      const data = await createBranch(r)
      return { success: true, data }
    } catch (err: any) {
      if (err.code === 11000) return { success: false, error: 'A branch with this code already exists' }
      return { success: false, error: err.message ?? 'Failed to create branch' }
    }
  })

  ipcMain.handle(IPC.BRANCHES_UPDATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_branches')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string; input: UpdateBranchInput }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await updateBranch(r.id, r.input)
      if (!data) return { success: false, error: 'Branch not found' }
      return { success: true, data }
    } catch (err: any) {
      if (err.code === 11000) return { success: false, error: 'A branch with this code already exists' }
      return { success: false, error: err.message ?? 'Failed to update branch' }
    }
  })

  ipcMain.handle(IPC.BRANCHES_DEACTIVATE, async (_e, req: unknown) => {
    try {
      const auth = await requireAuth(store.get('jwt') ?? null)
      if (!auth.role.permissions.includes('can_manage_branches')) {
        return { success: false, error: 'Permission denied' }
      }
      const r = req as { id: string }
      if (!r?.id) return { success: false, error: 'ID is required' }
      const data = await deactivateBranch(r.id)
      if (!data) return { success: false, error: 'Branch not found' }
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Failed to deactivate branch' }
    }
  })
}
