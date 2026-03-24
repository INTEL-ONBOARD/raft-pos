import mongoose from 'mongoose'
import { BrowserWindow } from 'electron'
import { IPC } from '../../shared/types/ipc.types'
import { saveResumeToken, loadResumeToken } from './resume-tokens'

// Collections to watch and their IPC push channels
const WATCHED_COLLECTIONS: Array<{ name: string; channel: string }> = [
  { name: 'transactions',    channel: IPC.STREAM_TRANSACTIONS },
  { name: 'inventory',       channel: IPC.STREAM_INVENTORY },
  { name: 'products',        channel: IPC.STREAM_PRODUCTS },
  { name: 'purchase_orders', channel: IPC.STREAM_PURCHASE_ORDERS },
  { name: 'cash_drawers',    channel: IPC.STREAM_CASH_DRAWERS },
  // stock_transfers: not yet implemented (Phase 6) — add back when StockTransfer model is created
]

const activeStreams: Map<string, mongoose.mongo.ChangeStream> = new Map()
const retryAttempts: Map<string, number> = new Map()

const MAX_RETRY_ATTEMPTS = 10
const BASE_RETRY_MS = 1000
const MAX_RETRY_MS = 60_000

function getRetryDelay(attempt: number): number {
  return Math.min(BASE_RETRY_MS * Math.pow(2, attempt), MAX_RETRY_MS)
}

export function startChangeStreams(win: BrowserWindow): void {
  for (const { name, channel } of WATCHED_COLLECTIONS) {
    retryAttempts.set(name, 0)
    startStream(name, channel, win)
  }
}

function startStream(collectionName: string, channel: string, win: BrowserWindow): void {
  const resumeToken = loadResumeToken(collectionName)
  const options = resumeToken ? { resumeAfter: resumeToken } : {}

  const collection = mongoose.connection.collection(collectionName)
  const stream: mongoose.mongo.ChangeStream = collection.watch([], options)

  stream.on('change', (event) => {
    retryAttempts.set(collectionName, 0) // reset backoff on successful event
    saveResumeToken(collectionName, stream.resumeToken)
    if (!win.isDestroyed()) {
      win.webContents.send(channel, event)
    }
  })

  stream.on('error', (err) => {
    console.error(`[ChangeStream] Error on ${collectionName}:`, err)
    stream.close()

    const attempt = retryAttempts.get(collectionName) ?? 0
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      console.error(`[ChangeStream] Max retries (${MAX_RETRY_ATTEMPTS}) reached for ${collectionName}. Giving up.`)
      return
    }
    retryAttempts.set(collectionName, attempt + 1)
    const delay = getRetryDelay(attempt)
    console.log(`[ChangeStream] Retrying ${collectionName} in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`)
    setTimeout(() => startStream(collectionName, channel, win), delay)
  })

  activeStreams.set(collectionName, stream)
}

export function stopChangeStreams(): void {
  for (const [name, stream] of activeStreams) {
    console.log(`[ChangeStream] Closing stream for ${name}`)
    stream.close()
  }
  activeStreams.clear()
}
