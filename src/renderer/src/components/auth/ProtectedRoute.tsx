import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { Permission } from '@shared/types/permissions'

interface ProtectedRouteProps {
  children: ReactNode
  permission?: Permission
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (permission && !role?.permissions.includes(permission)) {
    return <Navigate to="/home" replace />
  }
  return <>{children}</>
}
