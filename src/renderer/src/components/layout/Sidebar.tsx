import {
  LayoutDashboard, ShoppingCart, Package, FolderOpen,
  Warehouse, ClipboardList, Truck, ArrowLeftRight,
  BarChart3, Users, Shield, Settings, CreditCard,
  LogOut
} from 'lucide-react'
import { SidebarItem } from './SidebarItem'
import { useAuth } from '../../hooks/useAuth'
import { ipc } from '../../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { PERMISSIONS } from '@shared/types/permissions'

export function Sidebar() {
  const { user, clearAuth, hasPermission } = useAuth()

  async function handleLogout() {
    try {
      await ipc.invoke(IPC.AUTH_LOGOUT)
    } finally {
      // Always clear local auth state, even if the IPC call fails
      clearAuth()
    }
  }

  return (
    <div className="w-60 min-h-screen bg-slate-900 flex flex-col">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white text-base font-bold">R</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Raft POS</p>
            <p className="text-slate-400 text-xs">Hardware Store</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mb-2">Main Menu</p>

        <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Overview" />

        {hasPermission(PERMISSIONS.CAN_MAKE_SALE) && (
          <SidebarItem to="/orders" icon={ShoppingCart} label="Orders" />
        )}

        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mt-4 mb-2">Inventory</p>

        {hasPermission(PERMISSIONS.CAN_MANAGE_PRODUCTS) && (
          <SidebarItem to="/products" icon={Package} label="Products" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_CATEGORIES) && (
          <SidebarItem to="/categories" icon={FolderOpen} label="Categories" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_INVENTORY) && (
          <SidebarItem to="/inventory" icon={Warehouse} label="Inventory" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_PURCHASE_ORDERS) && (
          <SidebarItem to="/purchase-orders" icon={ClipboardList} label="Purchase Orders" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_SUPPLIERS) && (
          <SidebarItem to="/suppliers" icon={Truck} label="Suppliers" />
        )}

        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mt-4 mb-2">Reports</p>

        {hasPermission(PERMISSIONS.CAN_VIEW_REPORTS) && (
          <SidebarItem to="/reporting" icon={BarChart3} label="Reporting" />
        )}
        {hasPermission(PERMISSIONS.CAN_OPEN_CLOSE_DRAWER) && (
          <SidebarItem to="/cash-drawer" icon={CreditCard} label="Cash Drawer" />
        )}
        {hasPermission(PERMISSIONS.CAN_VOID_TRANSACTION) && (
          <SidebarItem to="/transactions" icon={ArrowLeftRight} label="Transactions" />
        )}

        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mt-4 mb-2">Admin</p>

        {hasPermission(PERMISSIONS.CAN_MANAGE_USERS) && (
          <SidebarItem to="/users" icon={Users} label="User Management" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_ROLES) && (
          <SidebarItem to="/roles" icon={Shield} label="Roles & Permissions" />
        )}
        {hasPermission(PERMISSIONS.CAN_MANAGE_SETTINGS) && (
          <SidebarItem to="/settings" icon={Settings} label="Settings" />
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
