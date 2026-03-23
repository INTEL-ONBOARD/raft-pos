// src/renderer/src/pages/dashboard/DashboardPage.tsx
import { useState } from 'react'
import { TrendingUp, ShoppingCart, Package, BarChart2, AlertTriangle } from 'lucide-react'
import { useDashboard } from '../../hooks/useDashboard'
import { useAuthStore } from '../../stores/auth.store'

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

function KpiCard({ icon, label, value, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const role = useAuthStore(s => s.role)
  const user = useAuthStore(s => s.user)
  const canViewAll = role?.permissions.includes('can_view_all_branches') ?? false
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const branchId = canViewAll && selectedBranchId ? selectedBranchId : undefined
  const { data: stats, isLoading, isError } = useDashboard(branchId)

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-400 text-sm">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading dashboard…
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="p-8 text-red-500 text-sm">Failed to load dashboard stats.</div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Today's sales activity</p>
        </div>
        {canViewAll && (
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500">Branch ID:</label>
            <input
              type="text"
              placeholder={user?.branchId ?? 'Own branch'}
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 font-mono"
            />
            {selectedBranchId && (
              <button onClick={() => setSelectedBranchId('')} className="text-gray-400 hover:text-gray-600 text-xs">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          label="Today's Revenue"
          value={`₱${fmt(stats.todayRevenue)}`}
          color="bg-blue-50"
        />
        <KpiCard
          icon={<ShoppingCart className="w-5 h-5 text-green-600" />}
          label="Transactions"
          value={String(stats.todayTransactions)}
          color="bg-green-50"
        />
        <KpiCard
          icon={<Package className="w-5 h-5 text-purple-600" />}
          label="Items Sold"
          value={String(stats.todayItemsSold)}
          color="bg-purple-50"
        />
        <KpiCard
          icon={<BarChart2 className="w-5 h-5 text-orange-600" />}
          label="Avg Order Value"
          value={`₱${fmt(stats.averageOrderValue)}`}
          color="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Top 5 Products Today</h2>
          </div>
          {stats.topSellers.length === 0 ? (
            <div className="p-6 text-gray-400 text-sm">No sales yet today.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.topSellers.map((item, i) => (
                <div key={item.productId} className="flex items-center gap-4 px-6 py-3">
                  <span className="text-lg font-bold text-gray-300 w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₱{fmt(item.revenue)}</p>
                    <p className="text-xs text-gray-400">{item.unitsSold} units</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <h2 className="text-base font-semibold text-gray-900">Low Stock Alerts</h2>
          </div>
          {stats.lowStockItems.length === 0 ? (
            <div className="p-6 text-gray-400 text-sm">All products are sufficiently stocked.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.lowStockItems.map(item => (
                <div key={item.productId} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${item.quantity <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {item.quantity} left
                    </p>
                    <p className="text-xs text-gray-400">Reorder at {item.reorderPoint}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
