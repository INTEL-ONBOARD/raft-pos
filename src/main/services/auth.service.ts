import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { User } from '../models/user.model'
import { Role } from '../models/role.model'
import { Session } from '../models/session.model'
import { Branch } from '../models/branch.model'
import store from '../store/electron-store'
import type {
  AuthPayload,
  AuthResult,
  SessionValidationResult,
  LoginRequest,
  SessionValidationFailureReason
} from '@shared/types/auth.types'
import type { PublicRole, PublicUser } from '@shared/types/auth.types'

// ─── JWT Secret (validated at module load to catch misconfig at startup) ──────
function getJwtSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) {
    throw new Error(
      'JWT_SECRET env variable is missing or too short (minimum 32 chars). Set it in .env.'
    )
  }
  return s
}

// SEC-003 FIX: Validate JWT secret at module initialization so a bad config
// fails loudly at startup rather than silently at first login attempt.
let _jwtSecret: string
try {
  _jwtSecret = getJwtSecret()
} catch (err) {
  console.error('[Auth] FATAL:', (err as Error).message)
  // Allow app to start so connectivity issues are distinguishable from config issues.
  // Any call that needs the secret will throw and the user will see a clear error.
  _jwtSecret = ''
}

const JWT_EXPIRES_IN = '8h'
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 hours

// ─── In-memory session cache (BUG-001 / SEC-001 FIX) ─────────────────────────
// Caches validated AuthPayload objects keyed by JWT string.
// TTL matches session expiry so the cache never returns an expired session.
// On logout / revocation, the entry is evicted immediately.
interface CacheEntry {
  payload: AuthPayload
  expiresAt: number // ms epoch
}
const sessionCache = new Map<string, CacheEntry>()

function cacheSet(token: string, payload: AuthPayload): void {
  sessionCache.set(token, { payload, expiresAt: payload.expiresAt })
}

function cacheGet(token: string): AuthPayload | null {
  const entry = sessionCache.get(token)
  if (!entry) return null
  if (Date.now() >= entry.expiresAt) {
    sessionCache.delete(token)
    return null
  }
  return entry.payload
}

function cacheEvict(token: string): void {
  sessionCache.delete(token)
}

// Periodically sweep expired entries so the Map doesn't grow unbounded
// (only relevant on a machine that runs for many hours without restarts)
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of sessionCache) {
      if (now >= entry.expiresAt) sessionCache.delete(key)
    }
  },
  30 * 60 * 1000 // every 30 minutes
)

// ─── Errors ───────────────────────────────────────────────────────────────────

export class UnauthorizedError extends Error {
  readonly reason: SessionValidationFailureReason

  constructor(reason: Exclude<SessionValidationFailureReason, 'system_error'>) {
    super('UNAUTHORIZED')
    this.name = 'UnauthorizedError'
    this.reason = reason
  }
}

// ─── login ────────────────────────────────────────────────────────────────────

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

  const terminalId = store.get('terminalId') ?? 'unknown'
  const jwtId = randomUUID()
  const issuedAt = new Date()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  const secret = getJwtSecret()
  const token = jwt.sign(
    { sub: user._id.toString(), jti: jwtId, roleId: role._id.toString() },
    secret,
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
    name: String(role.name),
    permissions: role.permissions.map((p) => String(p)) as PublicRole['permissions'],
    maxDiscountPercent: Number(role.maxDiscountPercent),
    requiresSupervisorOverride: Boolean(role.requiresSupervisorOverride)
  }

  const payload: AuthPayload = {
    user: publicUser,
    role: publicRole,
    token,
    expiresAt: expiresAt.getTime()
  }

  // Prime the cache on login so the first post-login IPC call is free
  cacheSet(token, payload)

  return { success: true, data: payload }
}

// ─── validateSession ──────────────────────────────────────────────────────────

export async function validateSession(token: string): Promise<SessionValidationResult> {
  let decoded: { sub: string; jti: string; roleId: string }

  try {
    const secret = getJwtSecret()
    decoded = jwt.verify(token, secret) as {
      sub: string
      jti: string
      roleId: string
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      return { valid: false, reason: 'expired' }
    }
    return { valid: false, reason: 'not_found' }
  }

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

  const branch = await Branch.findById(user.branchId, 'isActive').lean()
  if (!branch || !(branch as { isActive?: boolean }).isActive) {
    return { valid: false, reason: 'not_found' }
  }

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
    name: String(role.name),
    permissions: role.permissions.map((p) => String(p)) as PublicRole['permissions'],
    maxDiscountPercent: Number(role.maxDiscountPercent),
    requiresSupervisorOverride: Boolean(role.requiresSupervisorOverride)
  }

  return {
    valid: true,
    data: { user: publicUser, role: publicRole, token, expiresAt: session.expiresAt.getTime() }
  }
}

// ─── logout ───────────────────────────────────────────────────────────────────

export async function logout(token: string): Promise<void> {
  try {
    const secret = getJwtSecret()
    const decoded = jwt.verify(token, secret, { ignoreExpiration: true }) as { jti: string }
    await Session.findOneAndUpdate(
      { jwtId: decoded.jti },
      { isRevoked: true, revokedAt: new Date() }
    )
  } catch {
    // Token unverifiable — nothing to revoke
  }
  // BUG-001 FIX: evict from session cache on logout
  cacheEvict(token)
  store.delete('jwt')
}

// ─── requireAuthFast (JWT-only, no DB — use only for non-sensitive reads) ─────

export function requireAuthFast(token: string | null): {
  sub: string
  jti: string
  roleId: string
} {
  if (!token) throw new UnauthorizedError('not_found')
  try {
    const secret = getJwtSecret()
    return jwt.verify(token, secret) as { sub: string; jti: string; roleId: string }
  } catch {
    throw new UnauthorizedError('not_found')
  }
}

// ─── requireAuth (BUG-001 FIX: cache-first, DB-fallback) ─────────────────────

export async function requireAuth(token: string | null): Promise<AuthPayload> {
  if (!token) throw new UnauthorizedError('not_found')

  // Cache hit — avoids 5 DB queries per IPC call during normal operation
  const cached = cacheGet(token)
  if (cached) return cached

  // Cache miss — run full DB validation
  const result = await validateSession(token)
  if (!result.valid) {
    if (result.reason === 'system_error') {
      throw new Error(result.error ?? 'Session validation failed')
    }
    throw new UnauthorizedError(result.reason)
  }

  // Store in cache for subsequent calls
  cacheSet(token, result.data)
  return result.data
}

// ─── invalidateSessionCache (call when a user's role/branch/password changes) ─

export function invalidateSessionCache(token?: string): void {
  if (token) {
    cacheEvict(token)
  } else {
    sessionCache.clear()
  }
}
