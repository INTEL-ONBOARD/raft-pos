import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { User } from '../models/user.model'
import { Role } from '../models/role.model'
import { Session } from '../models/session.model'
import store from '../store/electron-store'
import type { AuthPayload, AuthResult, SessionValidationResult, LoginRequest } from '@shared/types/auth.types'
import type { PublicRole, PublicUser } from '@shared/types/auth.types'

const _jwtSecret = process.env.JWT_SECRET
if (!_jwtSecret || _jwtSecret.length < 32) {
  throw new Error('JWT_SECRET env variable is missing or too short (minimum 32 chars). Set it in .env.')
}
const JWT_SECRET: string = _jwtSecret
const JWT_EXPIRES_IN = '8h'
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 hours

export async function login(req: LoginRequest): Promise<AuthResult> {
  const { email, password } = req

  const user = await User.findOne({ email: email.toLowerCase(), isActive: true })
  if (!user) {
    return { success: false, error: 'Invalid email or password' }
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash)
  if (!passwordValid) {
    return { success: false, error: 'Invalid email or password' }
  }

  const role = await Role.findById(user.roleId)
  if (!role) {
    return { success: false, error: 'User role not found. Contact administrator.' }
  }

  const terminalId = store.get('terminalId')
  if (!terminalId) {
    return { success: false, error: 'Terminal is not provisioned. Contact administrator.' }
  }
  const jwtId = randomUUID()
  const issuedAt = new Date()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  const token = jwt.sign(
    { sub: user._id.toString(), jti: jwtId, roleId: role._id.toString() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  await Session.create({
    userId: user._id,
    terminalId,
    jwtId,
    issuedAt,
    expiresAt,
    isRevoked: false,
    revokedAt: null
  })

  // Update last login
  await User.findByIdAndUpdate(user._id, { lastLogin: issuedAt })

  // Persist token in electron-store
  store.set('jwt', token)

  const publicUser: PublicUser = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    roleId: user.roleId.toString(),
    branchId: user.branchId.toString(),
    isActive: user.isActive,
    lastLogin: issuedAt.getTime()
  }

  const publicRole: PublicRole = {
    _id: role._id.toString(),
    name: role.name,
    permissions: role.permissions,
    maxDiscountPercent: role.maxDiscountPercent,
    requiresSupervisorOverride: role.requiresSupervisorOverride
  }

  const payload: AuthPayload = {
    user: publicUser,
    role: publicRole,
    token,
    expiresAt: expiresAt.getTime()
  }

  return { success: true, data: payload }
}

export async function validateSession(token: string): Promise<SessionValidationResult> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; jti: string; roleId: string }

    const session = await Session.findOne({ jwtId: decoded.jti })
    if (!session) {
      return { valid: false, reason: 'not_found' }
    }
    if (session.isRevoked) {
      return { valid: false, reason: 'revoked' }
    }
    if (session.expiresAt < new Date()) {
      return { valid: false, reason: 'expired' }
    }

    const [user, role] = await Promise.all([
      User.findById(decoded.sub),
      Role.findById(decoded.roleId)
    ])
    if (!user || !user.isActive) return { valid: false, reason: 'not_found' }
    if (!role) return { valid: false, reason: 'not_found' }

    const publicUser: PublicUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      roleId: user.roleId.toString(),
      branchId: user.branchId.toString(),
      isActive: user.isActive,
      lastLogin: user.lastLogin ? user.lastLogin.getTime() : null
    }

    const publicRole: PublicRole = {
      _id: role._id.toString(),
      name: role.name,
      permissions: role.permissions,
      maxDiscountPercent: role.maxDiscountPercent,
      requiresSupervisorOverride: role.requiresSupervisorOverride
    }

    return {
      valid: true,
      data: { user: publicUser, role: publicRole, token, expiresAt: session.expiresAt.getTime() }
    }
  } catch (err: unknown) {
    // jwt.verify throws JsonWebTokenError for invalid tokens, TokenExpiredError for expired
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      return { valid: false, reason: 'expired' }
    }
    return { valid: false, reason: 'not_found' }
  }
}

export async function logout(token: string): Promise<void> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as { jti: string }
    await Session.findOneAndUpdate(
      { jwtId: decoded.jti },
      { isRevoked: true, revokedAt: new Date() }
    )
  } catch {
    // Token unverifiable — nothing to revoke
  }
  store.set('jwt', null as unknown as string)
}

export async function requireAuth(token: string | null): Promise<AuthPayload> {
  if (!token) throw new Error('UNAUTHORIZED')
  const result = await validateSession(token)
  if (!result.valid) throw new Error('UNAUTHORIZED')
  return result.data
}
