// src/main/handlers/supervisor.handlers.ts
import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import { IPC } from '@shared/types/ipc.types'
import { requireAuth } from '../services/auth.service'
import { User } from '../models/user.model'
import { ActivityLog } from '../models/activity-log.model'
import store from '../store/electron-store'

// In-memory PIN attempt tracker: key = "email:terminalId", value = { count, resetAt }
const pinAttempts = new Map<string, { count: number; resetAt: number }>()
const PIN_MAX_ATTEMPTS = 5
const PIN_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

function checkPinRateLimit(email: string, terminalId: string): { allowed: boolean; waitMs: number } {
  const key = `${email.toLowerCase()}:${terminalId}`
  const now = Date.now()
  const entry = pinAttempts.get(key)
  if (entry && now < entry.resetAt && entry.count >= PIN_MAX_ATTEMPTS) {
    return { allowed: false, waitMs: entry.resetAt - now }
  }
  return { allowed: true, waitMs: 0 }
}

function recordPinFailure(email: string, terminalId: string): void {
  const key = `${email.toLowerCase()}:${terminalId}`
  const now = Date.now()
  const entry = pinAttempts.get(key)
  if (!entry || now >= entry.resetAt) {
    pinAttempts.set(key, { count: 1, resetAt: now + PIN_WINDOW_MS })
  } else {
    entry.count++
  }
}

function clearPinAttempts(email: string, terminalId: string): void {
  pinAttempts.delete(`${email.toLowerCase()}:${terminalId}`)
}

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

      const terminalId = store.get('terminalId') ?? 'unknown'
      const rateCheck = checkPinRateLimit(r.supervisorEmail, terminalId)
      if (!rateCheck.allowed) {
        const waitSec = Math.ceil(rateCheck.waitMs / 1000)
        return { valid: false, error: `Too many failed attempts. Try again in ${waitSec} seconds.` }
      }

      // Look up the supervisor — use lean() to bypass the toJSON transform that
      // strips supervisorPin from the response
      const supervisor = await User.findOne({
        email: r.supervisorEmail.toLowerCase().trim(),
        isActive: true
      }).lean()

      if (!supervisor) {
        recordPinFailure(r.supervisorEmail, terminalId)
        return { valid: false, error: 'Supervisor not found' }
      }
      if (!supervisor.supervisorPin) {
        return { valid: false, error: 'This user has no supervisor PIN configured' }
      }

      const valid = await bcrypt.compare(r.pin, supervisor.supervisorPin)
      if (!valid) {
        recordPinFailure(r.supervisorEmail, terminalId)
        return { valid: false, error: 'Incorrect PIN' }
      }

      clearPinAttempts(r.supervisorEmail, terminalId)

      // Write activity log for audit trail
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
