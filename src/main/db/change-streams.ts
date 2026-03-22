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
  { name: 'stock_transfers', channel: IPC.STREAM_STOCK_TRANSFERS },
]

const activeStreams: Map<string, mongoose.mongo.ChangeStream> = new Map()

export function startChangeStreams(win: BrowserWindow): void {
  for (const { name, channel } of WATCHED_COLLECTIONS) {
    startStream(name, channel, win)
  }
}

function startStream(collectionName: string, channel: string, win: BrowserWindow): void {
  const resumeToken = loadResumeToken(collectionName)
  const options = resumeToken ? { resumeAfter: resumeToken } : {}

  const collection = mongoose.connection.collection(collectionName)
  const stream: mongoose.mongo.ChangeStream = collection.watch([], options)

  stream.on('change', (event) => {
    saveResumeToken(collectionName, stream.resumeToken)
    if (!win.isDestroyed()) {
      win.webContents.send(channel, event)
    }
  })

  stream.on('error', (err) => {
    console.error(`[ChangeStream] Error on ${collectionName}:`, err)
    stream.close()
    // Retry after 3 seconds
    setTimeout(() => startStream(collectionName, channel, win), 3000)
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
