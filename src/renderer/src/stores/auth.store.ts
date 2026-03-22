import { create } from 'zustand'
import type { AuthPayload, PublicUser, PublicRole } from '@shared/types/auth.types'

interface AuthState {
  isAuthenticated: boolean
  user: PublicUser | null
  role: PublicRole | null
  token: string | null
  expiresAt: number | null
  setAuth: (payload: AuthPayload) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  role: null,
  token: null,
  expiresAt: null,

  setAuth: (payload: AuthPayload) =>
    set({
      isAuthenticated: true,
      user: payload.user,
      role: payload.role,
      token: payload.token,
      expiresAt: payload.expiresAt
    }),

  clearAuth: () =>
    set({
      isAuthenticated: false,
      user: null,
      role: null,
      token: null,
      expiresAt: null
    })
}))
