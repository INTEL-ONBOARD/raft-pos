import { config } from 'dotenv'
config()

import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { optimizer, is } from '@electron-toolkit/utils'
import { connectDB, disconnectDB } from './db/connection'
import { startChangeStreams, stopChangeStreams } from './db/change-streams'
import { startConnectivityMonitor, stopConnectivityMonitor } from './connectivity/monitor'
import { registerAllHandlers } from './handlers/registry'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    show: false
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.raftpos')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerAllHandlers()

  let dbConnected = false
  try {
    await connectDB(process.env.MONGODB_URI!)
    dbConnected = true
  } catch (err) {
    console.error('[Main] Failed to connect to MongoDB:', err)
    // App still launches — connectivity monitor will detect offline and show overlay
  }

  const win = createWindow()

  // Only start Change Streams if DB connected successfully
  if (dbConnected) {
    startChangeStreams(win)
  }
  startConnectivityMonitor(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async () => {
  stopConnectivityMonitor()
  stopChangeStreams()
  await disconnectDB()
})
