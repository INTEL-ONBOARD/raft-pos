// src/shared/types/user.types.ts
export interface IPublicUser {
  _id: string
  name: string
  email: string
  roleId: string
  branchId: string
  isActive: boolean
  lastLogin: number | null
  createdAt: string
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  roleId: string
  branchId: string
  supervisorPin?: string
}

export interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
  roleId?: string
  branchId?: string
  supervisorPin?: string | null
  isActive?: boolean
}

export interface UsersResult {
  success: boolean
  data?: IPublicUser[]
  total?: number
  error?: string
}

export interface UserResult {
  success: boolean
  data?: IPublicUser
  error?: string
}

export interface UserActivityResult {
  success: boolean
  data?: ActivityLogEntry[]
  error?: string
}

export interface ActivityLogEntry {
  _id: string
  action: string
  targetId: string | null
  targetCollection: string | null
  metadata: Record<string, unknown>
  createdAt: string
}
