import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types/ipc.types'

// Build a Set of all valid channels from the IPC const to prevent arbitrary channel invocation
const ALLOWED_CHANNELS = new Set<string>(Object.values(IPC))

function assertAllowed(channel: string): void {
  if (!ALLOWED_CHANNELS.has(channel)) {
    throw new Error(`[Preload] Channel "${channel}" is not in the IPC allowlist.`)
  }
}

contextBridge.exposeInMainWorld('ipcBridge', {
  invoke: (channel: string, ...args: unknown[]) => {
    assertAllowed(channel)
    return ipcRenderer.invoke(channel, ...args)
  },

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    assertAllowed(channel)
    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, listener)
    // Return unsubscribe function
    return () => ipcRenderer.removeListener(channel, listener)
  },

  once: (channel: string, callback: (...args: unknown[]) => void) => {
    assertAllowed(channel)
    ipcRenderer.once(channel, (_event, ...args) => callback(...args))
  }
})
