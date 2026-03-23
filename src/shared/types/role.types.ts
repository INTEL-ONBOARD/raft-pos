// src/shared/types/role.types.ts
import type { Permission } from './permissions'

export interface IPublicRole {
  _id: string
  name: string
  permissions: Permission[]
  maxDiscountPercent: number
  requiresSupervisorOverride: boolean
  createdAt: string
}

export interface CreateRoleInput {
  name: string
  permissions: Permission[]
  maxDiscountPercent: number
  requiresSupervisorOverride: boolean
}

export interface UpdateRoleInput {
  name?: string
  permissions?: Permission[]
  maxDiscountPercent?: number
  requiresSupervisorOverride?: boolean
}

export interface RolesResult {
  success: boolean
  data?: IPublicRole[]
  error?: string
}

export interface RoleResult {
  success: boolean
  data?: IPublicRole
  error?: string
}
