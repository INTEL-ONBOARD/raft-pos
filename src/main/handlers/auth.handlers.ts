import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { IPC } from '@shared/types/ipc.types'
import { login, logout, validateSession } from '../services/auth.service'
import store from '../store/electron-store'
import { User } from '../models/user.model'
import { Role } from '../models/role.model'
import { Branch } from '../models/branch.model'
import { Settings } from '../models/settings.model'
import { ALL_PERMISSIONS } from '@shared/types/permissions'
import type { SetupRequest } from '@shared/types/auth.types'

// In-memory brute-force protection for login
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_LOGIN_ATTEMPTS = 10
const LOCKOUT_MS = 5 * 60 * 1000 // 5 minutes

function checkLoginRateLimit(email: string): void {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = loginAttempts.get(key)
  if (entry && now < entry.lockedUntil) {
    const secs = Math.ceil((entry.lockedUntil - now) / 1000)
    throw new Error(`Too many failed login attempts. Try again in ${secs} seconds.`)
  }
}

function recordLoginFailure(email: string): void {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = loginAttempts.get(key) ?? { count: 0, lockedUntil: 0 }
  entry.count += 1
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS
    entry.count = 0
  }
  loginAttempts.set(key, entry)
}

function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email.toLowerCase())
}

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
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!EMAIL_REGEX.test(r.email.trim())) {
      return { success: false, error: 'Invalid email format' }
    }
    try {
      checkLoginRateLimit(r.email)
      const result = await login(req as { email: string; password: string })
      if (result.success) {
        clearLoginAttempts(r.email)
      } else {
        recordLoginFailure(r.email)
      }
      return JSON.parse(JSON.stringify(result))
    } catch (err) {
      console.error('[IPC] AUTH_LOGIN error:', err)
      return { success: false, error: err instanceof Error ? err.message : 'An internal error occurred. Please try again.' }
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
      const result = await validateSession(token)
      return JSON.parse(JSON.stringify(result))
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
      const result = await validateSession(token)
      return JSON.parse(JSON.stringify(result))
    } catch (err) {
      console.error('[IPC] AUTH_ME error:', err)
      return { valid: false, reason: 'not_found' }
    }
  })

  // Check if first-time setup has been completed
  ipcMain.handle(IPC.AUTH_CHECK_SETUP, async () => {
    try {
      const count = await User.countDocuments({})
      return { setupComplete: count > 0 }
    } catch (err) {
      console.error('[IPC] AUTH_CHECK_SETUP error:', err)
      return { setupComplete: false }
    }
  })

  // Complete first-time setup: create branch, settings, admin role, and admin user
  ipcMain.handle(IPC.AUTH_COMPLETE_SETUP, async (_event, req: unknown) => {
    const r = req as SetupRequest
    if (
      typeof req !== 'object' ||
      req === null ||
      typeof r.storeName !== 'string' ||
      typeof r.branchName !== 'string' ||
      typeof r.name !== 'string' ||
      typeof r.email !== 'string' ||
      typeof r.password !== 'string' ||
      r.storeName.trim().length === 0 ||
      r.branchName.trim().length === 0 ||
      r.name.trim().length === 0 ||
      r.email.trim().length === 0 ||
      r.password.length < 8
    ) {
      return { success: false, error: 'Invalid request payload' }
    }
    const session = await mongoose.startSession()
    try {
      let alreadyDone = false
      await session.withTransaction(async () => {
        // Re-check inside session to prevent concurrent setup race
        const existingCount = await User.countDocuments({}).session(session)
        if (existingCount > 0) {
          alreadyDone = true
          return
        }

        const branchCode = r.branchName.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 10)
        const [branch] = await Branch.create([{
          name: r.branchName.trim(),
          code: branchCode,
          isActive: true,
        }], { session })

        await Settings.create([{ storeName: r.storeName.trim() }], { session })

        const [adminRole] = await Role.create([{
          name: 'Administrator',
          permissions: ALL_PERMISSIONS,
          maxDiscountPercent: 100,
          requiresSupervisorOverride: false,
        }], { session })

        const passwordHash = await bcrypt.hash(r.password, 12)
        await User.create([{
          name: r.name.trim(),
          email: r.email.trim().toLowerCase(),
          passwordHash,
          roleId: adminRole._id,
          branchId: branch._id,
          isActive: true,
        }], { session })
      })

      if (alreadyDone) return { success: false, error: 'Setup has already been completed.' }
      return { success: true }
    } catch (err) {
      console.error('[IPC] AUTH_COMPLETE_SETUP error:', err)
      return { success: false, error: 'Setup failed. Please try again.' }
    } finally {
      await session.endSession()
    }
  })
}
