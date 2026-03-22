import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useProductStore } from '../stores/product.store'
import type { ProductResult, ProductsResult, CreateProductInput, UpdateProductInput } from '@shared/types/product.types'

export function useProducts(opts?: { search?: string; categoryId?: string; isActive?: boolean }) {
  const { setProducts } = useProductStore()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['products', opts],
    queryFn: async () => {
      const result = await ipc.invoke<ProductsResult>(IPC.PRODUCTS_GET_ALL, opts ?? {})
      if (!result.success) throw new Error(result.error)
      setProducts(result.data, result.total)
      return result
    },
    staleTime: 30 * 1000
  })

  const create = useMutation({
    mutationFn: (input: CreateProductInput) =>
      ipc.invoke<ProductResult>(IPC.PRODUCTS_CREATE, { input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  const update = useMutation({
    mutationFn: (vars: { id: string; input: UpdateProductInput }) =>
      ipc.invoke<ProductResult>(IPC.PRODUCTS_UPDATE, vars),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  const deactivate = useMutation({
    mutationFn: (id: string) =>
      ipc.invoke<{ success: boolean }>(IPC.PRODUCTS_DEACTIVATE, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  return { query, create, update, deactivate }
}
