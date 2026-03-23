// src/renderer/src/hooks/usePurchaseOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { usePurchaseOrderStore } from '../stores/purchase-order.store'
import type {
  POsResult, POResult,
  CreatePOInput, UpdatePOInput, ReceivePOInput
} from '@shared/types/purchase-order.types'

export function usePurchaseOrders(opts?: {
  supplierId?: string
  status?: string
  limit?: number
  skip?: number
}) {
  const { setPurchaseOrders, updatePurchaseOrder, addPurchaseOrder } = usePurchaseOrderStore()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['purchase-orders', opts],
    queryFn: async () => {
      const result = await ipc.invoke<POsResult>(IPC.PO_GET_ALL, opts ?? {})
      if (!result.success) throw new Error(result.error)
      setPurchaseOrders(result.data, result.total)
      return result
    },
    staleTime: 30 * 1000
  })

  const create = useMutation({
    mutationFn: async (input: CreatePOInput) => {
      const result = await ipc.invoke<POResult>(IPC.PO_CREATE, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: (result) => {
      addPurchaseOrder(result.data)
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    }
  })

  const update = useMutation({
    mutationFn: async (vars: { id: string; input: UpdatePOInput }) => {
      const result = await ipc.invoke<POResult>(IPC.PO_UPDATE, vars)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: (result) => {
      updatePurchaseOrder(result.data)
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    }
  })

  const send = useMutation({
    mutationFn: async (id: string) => {
      const result = await ipc.invoke<POResult>(IPC.PO_SEND, { id })
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: (result) => {
      updatePurchaseOrder(result.data)
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    }
  })

  const receive = useMutation({
    mutationFn: async (input: ReceivePOInput) => {
      const result = await ipc.invoke<POResult>(IPC.PO_RECEIVE, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: (result) => {
      updatePurchaseOrder(result.data)
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      // Receiving stock changes inventory — invalidate inventory cache too
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const result = await ipc.invoke<POResult>(IPC.PO_CANCEL, { id })
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: (result) => {
      updatePurchaseOrder(result.data)
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    }
  })

  return { query, create, update, send, receive, cancel }
}
