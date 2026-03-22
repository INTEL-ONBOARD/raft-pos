import { useAuthStore } from '../stores/auth.store'
import type { Permission } from '@shared/types/permissions'

export function useAuth() {
  const { isAuthenticated, user, role, token, expiresAt, setAuth, clearAuth } = useAuthStore()

  function hasPermission(permission: Permission): boolean {
    if (!role) return false
    return role.permissions.includes(permission)
  }

  function hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(hasPermission)
  }

  return {
    isAuthenticated,
    user,
    role,
    token,
    expiresAt,
    setAuth,
    clearAuth,
    hasPermission,
    hasAnyPermission
  }
}
