import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { Permission } from '@shared/types/permissions'

interface ProtectedRouteProps {
  children: ReactNode
  permission?: Permission
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { isAuthenticated, expiresAt, role } = useAuth()

  // Session is valid if authenticated AND (no expiry OR expiry is in the future)
  const isSessionExpired = expiresAt != null && Date.now() >= expiresAt
  const sessionValid = isAuthenticated && !isSessionExpired

  if (!sessionValid) return <Navigate to="/login" replace />
  if (permission && !role?.permissions.includes(permission)) {
    return <Navigate to="/home" replace />
  }
  return <>{children}</>
}
