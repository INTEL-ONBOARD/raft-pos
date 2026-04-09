import mongoose from 'mongoose'
import { BrowserWindow } from 'electron'
import { IPC } from '../../shared/types/ipc.types'
import { saveResumeToken, loadResumeToken } from './resume-tokens'

// Collections to watch and their IPC push channels
const WATCHED_COLLECTIONS: Array<{ name: string; channel: string }> = [
  { name: 'transactions', channel: IPC.STREAM_TRANSACTIONS },
  { name: 'inventory', channel: IPC.STREAM_INVENTORY },
  { name: 'products', channel: IPC.STREAM_PRODUCTS },
  { name: 'purchase_orders', channel: IPC.STREAM_PURCHASE_ORDERS },
  { name: 'cash_drawers', channel: IPC.STREAM_CASH_DRAWERS }
  // stock_transfers: not yet implemented (Phase 6) — add back when StockTransfer model is created
]

const activeStreams: Map<string, mongoose.mongo.ChangeStream> = new Map()
const retryAttempts: Map<string, number> = new Map()
const retryTimers: Map<string, NodeJS.Timeout> = new Map()
const BASE_RETRY_MS = 1000
const MAX_RETRY_MS = 60_000
let shuttingDown = false

function getRetryDelay(attempt: number): number {
  return Math.min(BASE_RETRY_MS * Math.pow(2, attempt), MAX_RETRY_MS)
}

export function startChangeStreams(win: BrowserWindow): void {
  shuttingDown = false
  for (const { name, channel } of WATCHED_COLLECTIONS) {
    if (activeStreams.has(name)) continue
    startStream(name, channel, win)
  }
}

function startStream(collectionName: string, channel: string, win: BrowserWindow): void {
  if (shuttingDown || activeStreams.has(collectionName)) return
  clearRetryTimer(collectionName)

  const resumeToken = loadResumeToken(collectionName)
  const options = resumeToken ? { resumeAfter: resumeToken } : {}

  const collection = mongoose.connection.collection(collectionName)
  const stream: mongoose.mongo.ChangeStream = collection.watch([], options)
  activeStreams.set(collectionName, stream)

  stream.on('change', (event) => {
    retryAttempts.set(collectionName, 0)
    saveResumeToken(collectionName, stream.resumeToken)
    if (!win.isDestroyed()) {
      win.webContents.send(channel, event)
    }
  })

  stream.on('close', () => {
    activeStreams.delete(collectionName)
  })

  stream.on('error', (err) => {
    console.error(`[ChangeStream] Error on ${collectionName}:`, err)
    activeStreams.delete(collectionName)
    void stream.close().catch(() => {})
    if (shuttingDown) return

    const attempt = retryAttempts.get(collectionName) ?? 0
    retryAttempts.set(collectionName, attempt + 1)
    const delay = getRetryDelay(attempt)
    console.log(`[ChangeStream] Retrying ${collectionName} in ${delay}ms`)
    retryTimers.set(
      collectionName,
      setTimeout(() => {
        retryTimers.delete(collectionName)
        startStream(collectionName, channel, win)
      }, delay)
    )
  })
}

export function stopChangeStreams(): void {
  shuttingDown = true

  for (const timer of retryTimers.values()) {
    clearTimeout(timer)
  }
  retryTimers.clear()

  for (const [name, stream] of activeStreams) {
    console.log(`[ChangeStream] Closing stream for ${name}`)
    void stream.close().catch(() => {})
  }
  activeStreams.clear()
  retryAttempts.clear()
}

export function areChangeStreamsRunning(): boolean {
  return activeStreams.size > 0
}

function clearRetryTimer(collectionName: string): void {
  const timer = retryTimers.get(collectionName)
  if (!timer) return
  clearTimeout(timer)
  retryTimers.delete(collectionName)
}
