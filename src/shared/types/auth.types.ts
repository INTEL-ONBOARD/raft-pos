import type { Permission } from './permissions'

export interface PublicRole {
  _id: string
  name: string
  permissions: Permission[]
  maxDiscountPercent: number
  requiresSupervisorOverride: boolean
}

export interface PublicUser {
  _id: string
  name: string
  email: string
  roleId: string
  branchId: string
  isActive: boolean
  lastLogin: number | null // Unix timestamp ms
}

export interface AuthPayload {
  user: PublicUser
  role: PublicRole
  token: string
  expiresAt: number // Unix timestamp ms
}

export interface LoginRequest {
  email: string
  password: string
}

export type AuthResult =
  | { success: true; data: AuthPayload }
  | { success: false; error: string }

export type SessionValidationResult =
  | { valid: true; data: AuthPayload }
  | { valid: false; reason: 'expired' | 'revoked' | 'not_found' }

export interface SetupRequest {
  storeName: string
  branchName: string
  name: string
  email: string
  password: string
}

export type SetupResult =
  | { success: true }
  | { success: false; error: string }

export interface SetupCheckResult {
  setupComplete: boolean
}
