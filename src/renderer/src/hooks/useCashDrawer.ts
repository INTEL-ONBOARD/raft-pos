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
    mutationFn: (input: OpenDrawerInput) =>
      ipc.invoke<DrawerResult>(IPC.DRAWER_OPEN, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawer-open'] })
      queryClient.invalidateQueries({ queryKey: ['drawers'] })
    }
  })

  const closeMutation = useMutation({
    mutationFn: (input: CloseDrawerInput) =>
      ipc.invoke<DrawerResult>(IPC.DRAWER_CLOSE, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawer-open'] })
      queryClient.invalidateQueries({ queryKey: ['drawers'] })
    }
  })

  return { openDrawerQuery, drawersQuery, openMutation, closeMutation }
}
