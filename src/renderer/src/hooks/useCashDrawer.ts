// src/renderer/src/hooks/useCashDrawer.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type { DrawerResult, DrawersResult, OpenDrawerInput, CloseDrawerInput } from '@shared/types/cash-drawer.types'

export function useCashDrawer() {
  const queryClient = useQueryClient()

  const openDrawerQuery = useQuery({
    queryKey: ['drawer-open'],
    queryFn: async () => {
      const result = await ipc.invoke<DrawerResult>(IPC.DRAWER_GET_OPEN)
      if (!result.success) throw new Error(result.error)
      return result.data ?? null
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  })

  const drawersQuery = useQuery({
    queryKey: ['drawers'],
    queryFn: async () => {
      const result = await ipc.invoke<DrawersResult>(IPC.DRAWER_GET_ALL)
      if (!result.success) throw new Error(result.error)
      return result
    },
    staleTime: 60 * 1000
  })

  const openMutation = useMutation({
    mutationFn: async (input: OpenDrawerInput) => {
      const result = await ipc.invoke<DrawerResult>(IPC.DRAWER_OPEN, input)
      if (!result.success) throw new Error(result.error ?? 'Failed to open drawer')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawer-open'] })
      queryClient.invalidateQueries({ queryKey: ['drawers'] })
    }
  })

  const closeMutation = useMutation({
    mutationFn: async (input: CloseDrawerInput) => {
      const result = await ipc.invoke<DrawerResult>(IPC.DRAWER_CLOSE, input)
      if (!result.success) throw new Error(result.error ?? 'Failed to close drawer')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawer-open'] })
      queryClient.invalidateQueries({ queryKey: ['drawers'] })
    }
  })

  return { openDrawerQuery, drawersQuery, openMutation, closeMutation }
}
