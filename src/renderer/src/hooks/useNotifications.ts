import { useMemo } from 'react'
import type { DashboardStatsResult } from '@shared/types/dashboard.types'
import type { StockLevelRow } from '@shared/types/inventory.types'

export interface AppNotification {
  id: string
  title: string
  subtitle: string
  iconColor: string
  iconBg: string
  icon: 'warning' | 'cash' | 'transaction'
  href: string
}

interface UseNotificationsInput {
  statsResult: DashboardStatsResult | undefined
  stockData: StockLevelRow[] | undefined
  drawerStatus: 'open' | 'closed' | undefined
}

export function useNotifications({ statsResult, stockData, drawerStatus }: UseNotificationsInput): AppNotification[] {
  return useMemo(() => {
    const notifications: AppNotification[] = []
    const stats = statsResult?.data

    // Low stock
    const lowStockCount = (stockData ?? []).filter(
      (item) => item.reorderPoint != null && item.quantity <= item.reorderPoint
    ).length
    if (lowStockCount > 0) {
      notifications.push({
        id: 'low-stock',
        title: `${lowStockCount} item${lowStockCount === 1 ? '' : 's'} low on stock`,
        subtitle: 'Needs restocking',
        iconColor: 'var(--color-warning)',
        iconBg: 'var(--color-warning-bg)',
        icon: 'warning',
        href: '/inventory',
      })
    }

    // Cash drawer closed
    if (drawerStatus !== 'open') {
      notifications.push({
        id: 'drawer-closed',
        title: 'Cash drawer is closed',
        subtitle: 'No drawer open',
        iconColor: 'var(--color-danger)',
        iconBg: 'var(--color-danger-bg)',
        icon: 'cash',
        href: '/cash-drawer',
      })
    }

    // Today's transactions
    const txCount = stats?.todayTransactions ?? 0
    if (txCount > 0) {
      const revenue = stats?.todayRevenue ?? 0
      notifications.push({
        id: 'transactions',
        title: `${txCount} transaction${txCount === 1 ? '' : 's'} today`,
        subtitle: `₱${revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })} revenue`,
        iconColor: 'var(--color-success)',
        iconBg: 'var(--color-success-bg)',
        icon: 'transaction',
        href: '/transactions',
      })
    }

    return notifications
  }, [statsResult, stockData, drawerStatus])
}
