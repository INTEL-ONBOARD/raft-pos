import { ipcMain } from 'electron'
import { IPC } from '../../shared/types/ipc.types'

export function registerPingHandlers(): void {
  ipcMain.handle(IPC.HEALTH_PING, async () => {
    return { pong: true, timestamp: Date.now() }
  })
}
