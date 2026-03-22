import mongoose from 'mongoose'

let isConnected = false

export async function connectDB(uri: string): Promise<void> {
  if (isConnected) return

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000
  })

  isConnected = true
  console.log('[DB] Connected to MongoDB Atlas')
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

export async function pingDB(): Promise<boolean> {
  try {
    await mongoose.connection.db!.command({ ping: 1 })
    return true
  } catch {
    return false
  }
}
