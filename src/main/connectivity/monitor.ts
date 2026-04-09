import { BrowserWindow } from 'electron'
import { connectDB, isDBConnected, pingDB } from '../db/connection'
import {
  areChangeStreamsRunning,
  startChangeStreams,
  stopChangeStreams
} from '../db/change-streams'
import { IPC } from '../../shared/types/ipc.types'
import type { ConnectivityEvent } from '../../shared/types/connectivity.types'

const PING_INTERVAL_MS = 3000
let intervalId: NodeJS.Timeout | null = null
let lastStatus: 'online' | 'offline' | null = null

export function startConnectivityMonitor(win: BrowserWindow): void {
  const tick = async () => {
    if (!isDBConnected() && process.env.MONGODB_URI) {
      try {
        await connectDB(process.env.MONGODB_URI)
      } catch {
        // Connectivity status is emitted below; keep retrying on the next interval.
      }
    }

    const isAlive = await pingDB()
    const status = isAlive ? 'online' : 'offline'

    if (isAlive && !areChangeStreamsRunning()) {
      startChangeStreams(win)
    }
    if (!isAlive && areChangeStreamsRunning()) {
      stopChangeStreams()
    }

    if (status !== lastStatus) {
      lastStatus = status
      const event: ConnectivityEvent = { status }
      if (!win.isDestroyed()) {
        win.webContents.send(IPC.APP_CONNECTIVITY, event)
      }
      console.log(`[Connectivity] Status changed: ${status}`)
    }
  }

  void tick()
  intervalId = setInterval(() => {
    void tick()
  }, PING_INTERVAL_MS)
}

export function stopConnectivityMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  lastStatus = null
}
