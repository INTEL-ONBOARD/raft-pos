import { create } from 'zustand'
import type { ConnectivityStatus } from '../../../shared/types/connectivity.types'

interface ConnectivityState {
  status: ConnectivityStatus
  setStatus: (status: ConnectivityStatus) => void
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  status: 'online', // optimistic — overlay only shows after first offline event
  setStatus: (status) => set({ status })
}))
