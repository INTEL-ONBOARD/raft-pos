// src/renderer/src/hooks/useRoles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type { RolesResult, RoleResult, CreateRoleInput, UpdateRoleInput } from '@shared/types/role.types'

export function useRoles() {
  const queryClient = useQueryClient()

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const result = await ipc.invoke<RolesResult>(IPC.ROLES_GET_ALL)
      if (!result.success) throw new Error(result.error)
      return result.data ?? []
    },
    staleTime: 60_000
  })

  const createMutation = useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const result = await ipc.invoke<RoleResult>(IPC.ROLES_CREATE, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoleInput }) => {
      const result = await ipc.invoke<RoleResult>(IPC.ROLES_UPDATE, { id, input })
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await ipc.invoke<{ success: boolean; error?: string }>(IPC.ROLES_DELETE, { id })
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  })

  return { rolesQuery, createMutation, updateMutation, deleteMutation }
}
