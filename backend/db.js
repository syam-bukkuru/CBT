import mongoose from 'mongoose'

// Attempt to connect, retrying in the background so a transient DNS / network
// hiccup doesn't take the whole dev server down. Routes return 500 until ready.
export function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('[db] MONGODB_URI is not set in .env')
    return
  }

  const attempt = async () => {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
      console.log('[db] MongoDB connected')
    } catch (err) {
      console.error(`[db] connection failed: ${err.message} — retrying in 5s`)
      setTimeout(attempt, 5000)
    }
  }

  attempt()

  mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'))
  mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconnected'))
}

export function dbReady() {
  return mongoose.connection.readyState === 1
}
