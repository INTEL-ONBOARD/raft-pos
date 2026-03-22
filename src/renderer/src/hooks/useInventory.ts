import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useInventoryStore } from '../stores/inventory.store'
import type { StockLevelsResult, AdjustmentResult, ManualAdjustmentInput } from '@shared/types/inventory.types'

export function useInventory() {
  const setStockLevels = useInventoryStore(s => s.setStockLevels)
  const queryClient = useQueryClient()

  const stockQuery = useQuery({
    queryKey: ['inventory', 'stock-levels'],
    queryFn: async () => {
      const result = await ipc.invoke<StockLevelsResult>(IPC.INVENTORY_GET_STOCK_LEVELS)
      if (!result.success) throw new Error(result.error)
      setStockLevels(result.data)
      return result.data
    },
    staleTime: 15 * 1000
  })

  const adjust = useMutation({
    mutationFn: (input: ManualAdjustmentInput) =>
      ipc.invoke<AdjustmentResult>(IPC.INVENTORY_ADJUST, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  return { stockQuery, adjust }
}
