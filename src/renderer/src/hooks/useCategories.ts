import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import { useCategoryStore } from '../stores/category.store'
import type { CategoriesResult, CategoryResult } from '@shared/types/category.types'

export function useCategories() {
  const setCategories = useCategoryStore(s => s.setCategories)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await ipc.invoke<CategoriesResult>(IPC.CATEGORIES_GET_ALL)
      if (!result.success) throw new Error(result.error)
      setCategories(result.data)
      return result.data
    },
    staleTime: 5 * 60 * 1000
  })

  const create = useMutation({
    mutationFn: async (data: { name: string; parentId?: string | null }) => {
      const result = await ipc.invoke<CategoryResult>(IPC.CATEGORIES_CREATE, data)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  const update = useMutation({
    mutationFn: async (vars: { id: string; data: any }) => {
      const result = await ipc.invoke<CategoryResult>(IPC.CATEGORIES_UPDATE, vars)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const result = await ipc.invoke<{ success: boolean; error?: string }>(IPC.CATEGORIES_DELETE, { id })
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  return { query, create, update, remove }
}
