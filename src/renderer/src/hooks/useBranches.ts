import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'

export interface IBranch {
  _id: string
  name: string
  code: string
  address: string
  phone: string
  email: string
  isActive: boolean
}

interface BranchesResult { success: boolean; data?: IBranch[]; error?: string }
interface BranchResult   { success: boolean; data?: IBranch;  error?: string }

export interface CreateBranchInput {
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
}

export interface UpdateBranchInput {
  name?: string
  code?: string
  address?: string
  phone?: string
  email?: string
}

export function useBranches() {
  const queryClient = useQueryClient()

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const result = await ipc.invoke<BranchesResult>(IPC.BRANCHES_GET_ALL)
      if (!result.success) throw new Error(result.error)
      return result.data ?? []
    },
    staleTime: 5 * 60_000,
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: async (input: CreateBranchInput) => {
      const result = await ipc.invoke<BranchResult>(IPC.BRANCHES_CREATE, input)
      if (!result.success) throw new Error(result.error)
      return result.data!
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateBranchInput }) => {
      const result = await ipc.invoke<BranchResult>(IPC.BRANCHES_UPDATE, { id, input })
      if (!result.success) throw new Error(result.error)
      return result.data!
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await ipc.invoke<BranchResult>(IPC.BRANCHES_DEACTIVATE, { id })
      if (!result.success) throw new Error(result.error)
      return result.data!
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  })

  return { branchesQuery, createMutation, updateMutation, deactivateMutation }
}
