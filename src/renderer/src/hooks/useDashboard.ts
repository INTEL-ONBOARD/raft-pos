// src/renderer/src/hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type { DashboardStatsResult } from '@shared/types/dashboard.types'

export function useDashboard(branchId?: string) {
  return useQuery({
    queryKey: ['dashboard', branchId],
    queryFn: async () => {
      const result = await ipc.invoke<DashboardStatsResult>(
        IPC.DASHBOARD_GET_STATS,
        branchId ? { branchId } : {}
      )
      if (!result.success) throw new Error(result.error)
      return result.data!
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  })
}
