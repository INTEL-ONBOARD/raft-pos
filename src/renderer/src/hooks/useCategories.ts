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
    mutationFn: (data: { name: string; parentId?: string | null }) =>
      ipc.invoke<CategoryResult>(IPC.CATEGORIES_CREATE, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  const update = useMutation({
    mutationFn: (vars: { id: string; data: any }) =>
      ipc.invoke<CategoryResult>(IPC.CATEGORIES_UPDATE, vars),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      ipc.invoke<{ success: boolean; error?: string }>(IPC.CATEGORIES_DELETE, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })

  return { query, create, update, remove }
}
