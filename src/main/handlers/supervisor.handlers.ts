// src/main/handlers/supervisor.handlers.ts
import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import { User } from '../models/user.model'
import { ActivityLog } from '../models/activity-log.model'
import store from '../store/electron-store'

export function registerSupervisorHandlers(): void {

  // ── POS_VALIDATE_SUPERVISOR_PIN ────────────────────────────────────────────
  // The cashier is already logged in. This handler validates a DIFFERENT user's
  // supervisor PIN (e.g., a manager approving a discount override).
  // It does NOT require the supervisor to be logged in on this terminal.
  ipcMain.handle(IPC.POS_VALIDATE_SUPERVISOR_PIN, async (_e, req: unknown) => {
    try {
      // Cashier must still be authenticated
      const auth = await requireAuth(store.get('jwt') ?? null)

      const r = req as { supervisorEmail: string; pin: string }
      if (!r?.supervisorEmail?.trim() || !r?.pin) {
        return { valid: false, error: 'Supervisor email and PIN are required' }
      }

      // Look up the supervisor — use lean() to bypass the toJSON transform that
      // strips supervisorPin from the response
      const supervisor = await User.findOne({
        email: r.supervisorEmail.toLowerCase().trim(),
        isActive: true
      }).lean()

      if (!supervisor) return { valid: false, error: 'Supervisor not found' }
      if (!supervisor.supervisorPin) {
        return { valid: false, error: 'This user has no supervisor PIN configured' }
      }

      const valid = await bcrypt.compare(r.pin, supervisor.supervisorPin)
      if (!valid) return { valid: false, error: 'Incorrect PIN' }

      // Write activity log for audit trail
      const terminalId = store.get('terminalId') ?? 'unknown'
      await ActivityLog.create({
        userId: auth.user._id,
        branchId: auth.user.branchId,
        terminalId,
        action: 'discount_override',
        targetId: null,
        targetCollection: null,
        metadata: {
          cashierId: auth.user._id,
          supervisorId: supervisor._id.toString(),
          supervisorEmail: supervisor.email
        }
      }).catch(() => {})

      return {
        valid: true,
        supervisorId: supervisor._id.toString(),
        supervisorName: supervisor.name
      }
    } catch (err: any) {
      console.error('[IPC] POS_VALIDATE_SUPERVISOR_PIN:', err)
      return { valid: false, error: 'Validation failed' }
    }
  })
}
