import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ipc } from './lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useConnectivityStore } from './stores/connectivity.store'
import { useAuthStore } from './stores/auth.store'
import { ConnectivityOverlay } from './components/ConnectivityOverlay'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/auth/LoginPage'
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
import type { SessionValidationResult } from '@shared/types/auth.types'

export default function App() {
  const setConnectivityStatus = useConnectivityStore((s) => s.setStatus)
  const { setAuth, clearAuth } = useAuthStore()
  const queryClient = useQueryClient()

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

  // Invalidate React Query caches when Change Stream push events arrive
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

  // Restore session from electron-store on startup
  useEffect(() => {
    const timeout = new Promise<SessionValidationResult>((resolve) =>
      setTimeout(() => resolve({ valid: false, reason: 'not_found' }), 5000)
    )
    Promise.race([ipc.invoke<SessionValidationResult>(IPC.AUTH_VALIDATE_SESSION), timeout])
      .then((result) => {
        if (result.valid) {
          setAuth(result.data)
        }
      })
      .catch(() => {})
  }, [setAuth])

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
    </HashRouter>
  )
}
