import { BrowserWindow } from 'electron'
import { pingDB } from '../db/connection'
import { IPC } from '../../shared/types/ipc.types'
import type { ConnectivityEvent } from '../../shared/types/connectivity.types'

const PING_INTERVAL_MS = 3000
let intervalId: NodeJS.Timeout | null = null
let lastStatus: 'online' | 'offline' | null = null

export function startConnectivityMonitor(win: BrowserWindow): void {
  intervalId = setInterval(async () => {
    const isAlive = await pingDB()
    const status = isAlive ? 'online' : 'offline'

    // Only emit when status changes to avoid flooding renderer
    if (status !== lastStatus) {
      lastStatus = status
      const event: ConnectivityEvent = { status }
      if (!win.isDestroyed()) {
        win.webContents.send(IPC.APP_CONNECTIVITY, event)
      }
      console.log(`[Connectivity] Status changed: ${status}`)
    }
  }, PING_INTERVAL_MS)
}

export function stopConnectivityMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
