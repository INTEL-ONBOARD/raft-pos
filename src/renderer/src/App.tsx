import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ipc } from './lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useConnectivityStore } from './stores/connectivity.store'
import { useAuthStore } from './stores/auth.store'
import { ConnectivityOverlay } from './components/ConnectivityOverlay'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/auth/LoginPage'
import SetupPage from './pages/auth/SetupPage'
import HomePage from './pages/home/HomePage'
import DashboardPage from './pages/dashboard/DashboardPage'
import CategoriesPage from './pages/categories/CategoriesPage'
import ProductsPage from './pages/products/ProductsPage'
import InventoryPage from './pages/inventory/InventoryPage'
import PosPage from './pages/pos/PosPage'
import SuppliersPage from './pages/suppliers/SuppliersPage'
import PurchaseOrdersPage from './pages/purchase-orders/PurchaseOrdersPage'
import PurchaseOrderFormPage from './pages/purchase-orders/PurchaseOrderFormPage'
import TransactionsPage from './pages/transactions/TransactionsPage'
import CashDrawerPage from './pages/cash-drawer/CashDrawerPage'
import UsersPage from './pages/users/UsersPage'
import RolesPage from './pages/roles/RolesPage'
import SettingsPage from './pages/settings/SettingsPage'
import ReportingPage from './pages/reporting/ReportingPage'
import type { ConnectivityEvent } from '@shared/types/connectivity.types'
import type { SessionValidationResult, SetupCheckResult } from '@shared/types/auth.types'

// Inner component that can use React Router hooks (must be inside HashRouter)
function AppRoutes() {
  const navigate = useNavigate()
  const setConnectivityStatus = useConnectivityStore((s) => s.setStatus)
  const { setAuth, clearAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const [sessionChecked, setSessionChecked] = useState(false)

  // Subscribe to connectivity events
  useEffect(() => {
    const unsub = ipc.on(IPC.APP_CONNECTIVITY, (event) => {
      setConnectivityStatus((event as ConnectivityEvent).status)
    })
    return unsub
  }, [setConnectivityStatus])

  // Subscribe to session revocation / expiry push events
  useEffect(() => {
    const unsubRevoked = ipc.on(IPC.AUTH_SESSION_REVOKED, () => clearAuth())
    const unsubExpired = ipc.on(IPC.AUTH_SESSION_EXPIRED, () => clearAuth())
    return () => {
      unsubRevoked()
      unsubExpired()
    }
  }, [clearAuth])

  // Invalidate React Query caches on Change Stream push events
  useEffect(() => {
    const unsubProducts = ipc.on(IPC.STREAM_PRODUCTS, () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    })
    const unsubInventory = ipc.on(IPC.STREAM_INVENTORY, () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    })
    const unsubTransactions = ipc.on(IPC.STREAM_TRANSACTIONS, () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })
    const unsubPurchaseOrders = ipc.on(IPC.STREAM_PURCHASE_ORDERS, () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    })
    const unsubCashDrawers = ipc.on(IPC.STREAM_CASH_DRAWERS, () => {
      queryClient.invalidateQueries({ queryKey: ['drawer-open'] })
      queryClient.invalidateQueries({ queryKey: ['drawers'] })
    })
    return () => {
      unsubProducts()
      unsubInventory()
      unsubTransactions()
      unsubPurchaseOrders()
      unsubCashDrawers()
    }
  }, [queryClient])

  // Startup: validate session + check setup status in parallel
  useEffect(() => {
    const timeout = new Promise<[SessionValidationResult, SetupCheckResult]>((resolve) =>
      setTimeout(
        () => resolve([{ valid: false, reason: 'not_found' }, { setupComplete: true }]),
        5000
      )
    )

    const checks = Promise.all([
      ipc.invoke<SessionValidationResult>(IPC.AUTH_VALIDATE_SESSION).catch(
        (): SessionValidationResult => ({ valid: false, reason: 'not_found' })
      ),
      ipc.invoke<SetupCheckResult>(IPC.AUTH_CHECK_SETUP).catch(() => ({ setupComplete: true })),
    ])

    Promise.race([checks, timeout])
      .then(([sessionResult, setupResult]) => {
        if (!setupResult.setupComplete) {
          navigate('/setup', { replace: true })
          setSessionChecked(true)
          return
        }
        if (sessionResult.valid) {
          setAuth(sessionResult.data)
        } else {
          clearAuth()
        }
        setSessionChecked(true)
      })
      .catch(() => {
        setSessionChecked(true)
      })
  }, [setAuth, clearAuth, navigate])

  // Show dark spinner while startup checks run
  if (!sessionChecked) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ background: '#111315' }}
      >
        <div
          className="animate-spin"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.2)',
            borderTopColor: '#6366f1',
          }}
        />
      </div>
    )
  }

  return (
    <>
      <ConnectivityOverlay />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="orders" element={<PosPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="purchase-orders/new" element={<PurchaseOrderFormPage />} />
          <Route path="purchase-orders/:id/edit" element={<PurchaseOrderFormPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="cash-drawer" element={<CashDrawerPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="reporting" element={<ReportingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
