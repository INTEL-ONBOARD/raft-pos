// src/renderer/src/hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import { IPC } from '@shared/types/ipc.types'
import type { SettingsResult, UpdateSettingsInput } from '@shared/types/settings.types'

export function useSettings() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await ipc.invoke<SettingsResult>(IPC.SETTINGS_GET)
      if (!result.success) throw new Error(result.error)
      return result.data!
    },
    staleTime: 5 * 60_000
  })

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateSettingsInput & { terminalId?: string }) => {
      const result = await ipc.invoke<SettingsResult>(IPC.SETTINGS_UPDATE, input)
      if (!result.success) throw new Error(result.error)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] })
  })

  return { settingsQuery, updateMutation }
}
