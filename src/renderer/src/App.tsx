import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ipc } from './lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useConnectivityStore } from './stores/connectivity.store'
import { useAuthStore } from './stores/auth.store'
import { ConnectivityOverlay } from './components/ConnectivityOverlay'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import type { ConnectivityEvent } from '@shared/types/connectivity.types'
import type { SessionValidationResult } from '@shared/types/auth.types'

export default function App() {
  const setConnectivityStatus = useConnectivityStore((s) => s.setStatus)
  const { setAuth, clearAuth } = useAuthStore()
  const [sessionChecked, setSessionChecked] = useState(false)

  // Subscribe to connectivity events
  useEffect(() => {
    const unsub = ipc.on(IPC.APP_CONNECTIVITY, (event) => {
      setConnectivityStatus((event as ConnectivityEvent).status)
    })
    return unsub
  }, [setConnectivityStatus])

  // Subscribe to session revocation / expiry push events from main process
  useEffect(() => {
    const unsubRevoked = ipc.on(IPC.AUTH_SESSION_REVOKED, () => clearAuth())
    const unsubExpired = ipc.on(IPC.AUTH_SESSION_EXPIRED, () => clearAuth())
    return () => {
      unsubRevoked()
      unsubExpired()
    }
  }, [clearAuth])

  // Restore session from electron-store on startup
  useEffect(() => {
    ipc
      .invoke<SessionValidationResult>(IPC.AUTH_VALIDATE_SESSION)
      .then((result) => {
        if (result.valid) {
          setAuth(result.data)
        }
      })
      .finally(() => setSessionChecked(true))
  }, [setAuth])

  // Don't render routes until session check completes (prevents flash to /login)
  if (!sessionChecked) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <HashRouter>
      <ConnectivityOverlay />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          {/* All future pages added here in later phases */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
