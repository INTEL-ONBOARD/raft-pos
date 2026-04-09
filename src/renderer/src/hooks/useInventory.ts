import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useInventoryStore } from '../stores/inventory.store'
import { useAuthStore } from '../stores/auth.store'
import type {
  StockLevelsResult,
  AdjustmentResult,
  ManualAdjustmentInput
} from '@shared/types/inventory.types'

export function useInventory() {
  const setStockLevels = useInventoryStore((s) => s.setStockLevels)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const expiresAt = useAuthStore((s) => s.expiresAt)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const queryClient = useQueryClient()
  const hasValidSession = isAuthenticated && (expiresAt == null || Date.now() < expiresAt)

  const stockQuery = useQuery({
    queryKey: ['inventory', 'stock-levels'],
    enabled: hasValidSession,
    queryFn: async () => {
      const result = await ipc.invoke<StockLevelsResult>(IPC.INVENTORY_GET_STOCK_LEVELS)
      if (!result.success && (result.error ?? '').includes('UNAUTHORIZED')) {
        clearAuth()
      }
      if (!result.success) throw new Error(result.error)
      setStockLevels(result.data)
      return result.data
    },
    staleTime: 15 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('UNAUTHORIZED')) return false
      return failureCount < 2
    }
  })

  const adjust = useMutation({
    mutationFn: async (input: ManualAdjustmentInput) => {
      const result = await ipc.invoke<AdjustmentResult>(IPC.INVENTORY_ADJUST, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  return { stockQuery, adjust }
}
