import mongoose from 'mongoose'

let isConnected = false
let listenersRegistered = false

export async function connectDB(uri: string): Promise<void> {
  if (!uri) throw new Error('MONGODB_URI is not configured')
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true
    return
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000
  })

  isConnected = true
  console.log('[DB] Connected to MongoDB Atlas')

  if (!listenersRegistered) {
    mongoose.connection.on('disconnected', () => {
      isConnected = false
      console.log('[DB] Disconnected from MongoDB Atlas')
    })
    mongoose.connection.on('reconnected', () => {
      isConnected = true
      console.log('[DB] Reconnected to MongoDB Atlas')
    })
    mongoose.connection.on('error', () => {
      isConnected = false
    })
    listenersRegistered = true
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return
  await mongoose.disconnect()
  isConnected = false
  console.log('[DB] Disconnected from MongoDB Atlas')
}

export function getDB(): typeof mongoose {
  if (!isConnected) throw new Error('[DB] Not connected. Call connectDB() first.')
  return mongoose
}

export function isDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1
}

export async function pingDB(): Promise<boolean> {
  try {
    await mongoose.connection.db!.command({ ping: 1 })
    return true
  } catch {
    return false
  }
}
