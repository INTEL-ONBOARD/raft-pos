// src/renderer/src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type { UsersResult, UserResult, UserActivityResult, CreateUserInput, UpdateUserInput } from '@shared/types/user.types'

export function useUsers() {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await ipc.invoke<UsersResult>(IPC.USERS_GET_ALL)
      if (!result.success) throw new Error(result.error)
      return result.data ?? []
    },
    staleTime: 60_000
  })

  const createMutation = useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const result = await ipc.invoke<UserResult>(IPC.USERS_CREATE, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateUserInput }) => {
      const result = await ipc.invoke<UserResult>(IPC.USERS_UPDATE, { id, input })
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await ipc.invoke<UserResult>(IPC.USERS_DEACTIVATE, { id })
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  const forceLogoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await ipc.invoke<{ success: boolean; error?: string }>(IPC.USERS_FORCE_LOGOUT, { id })
      if (!result.success) throw new Error(result.error)
      return result
    }
  })

  return { usersQuery, createMutation, updateMutation, deactivateMutation, forceLogoutMutation }
}

export function useUserActivity(userId: string | null) {
  return useQuery({
    queryKey: ['user-activity', userId],
    queryFn: async () => {
      const result = await ipc.invoke<UserActivityResult>(IPC.USERS_GET_ACTIVITY, { id: userId })
      if (!result.success) throw new Error(result.error)
      return result.data ?? []
    },
    enabled: !!userId,
    staleTime: 30_000
  })
}
