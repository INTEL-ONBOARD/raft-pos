// src/renderer/src/hooks/useSuppliers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useSupplierStore } from '../stores/supplier.store'
import type {
  SuppliersResult, SupplierResult,
  CreateSupplierInput, UpdateSupplierInput
} from '@shared/types/supplier.types'

export function useSuppliers(opts?: { includeInactive?: boolean }) {
  const { setSuppliers } = useSupplierStore()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['suppliers', opts],
    queryFn: async () => {
      const result = await ipc.invoke<SuppliersResult>(IPC.SUPPLIERS_GET_ALL, opts ?? {})
      if (!result.success) throw new Error(result.error)
      setSuppliers(result.data)
      return result
    },
    staleTime: 30 * 1000
  })

  const create = useMutation({
    mutationFn: async (input: CreateSupplierInput) => {
      const result = await ipc.invoke<SupplierResult>(IPC.SUPPLIERS_CREATE, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  })

  const update = useMutation({
    mutationFn: async (vars: { id: string; input: UpdateSupplierInput }) => {
      const result = await ipc.invoke<SupplierResult>(IPC.SUPPLIERS_UPDATE, vars)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  })

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      const result = await ipc.invoke<SupplierResult>(IPC.SUPPLIERS_DEACTIVATE, { id })
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  })

  return { query, create, update, deactivate }
}
