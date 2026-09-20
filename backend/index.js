import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') })

import cors from 'cors'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { MongoClient } from 'mongodb'
import { connectDB, dbReady } from './db.js'
import requireAuth from './middleware/requireAuth.js'
import authRouter from './routes/auth.js'
import topicsRouter from './routes/topics.js'
import subjectsRouter from './routes/subjects.js'
import testsRouter from './routes/tests.js'
import attemptsRouter from './routes/attempts.js'

const app = express()
const PORT = process.env.PORT || 5000

// connect-mongo's `mongoUrl` option connects immediately and, on failure, rejects an internal
// promise nobody awaits — an unhandled rejection that crashes the whole process. Feeding it a
// promise that retries instead of rejecting keeps a transient DB hiccup from taking the server
// down, mirroring the retry loop `connectDB()` already uses for the main Mongoose connection.
function connectSessionClientWithRetry(uri) {
  return new Promise((resolve) => {
    const attempt = () => {
      MongoClient.connect(uri, { serverSelectionTimeoutMS: 10000 })
        .then(resolve)
        .catch((err) => {
          console.error(`[session-store] connection failed: ${err.message} — retrying in 5s`)
          setTimeout(attempt, 5000)
        })
    }
    attempt()
  })
}

app.set('trust proxy', 1)
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '5mb' }))

const isProd = process.env.NODE_ENV === 'production'

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me',
    store: MongoStore.create({ clientPromise: connectSessionClientWithRetry(process.env.MONGODB_URI) }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax'),
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
)

app.get('/api/health', (_req, res) => res.json({ ok: true, db: dbReady() }))

// Fail fast with a clear message while the database is still connecting.
app.use('/api', (_req, res, next) => {
  if (!dbReady()) {
    return res.status(503).json({ error: 'Database not connected yet — check the server console.' })
  }
  next()
})

// Auth routes are public (register/login/logout/me); everything else needs a session.
app.use('/api/auth', authRouter)
app.use('/api/topics', requireAuth, topicsRouter)
app.use('/api/subjects', requireAuth, subjectsRouter)
app.use('/api/tests', requireAuth, testsRouter)
app.use('/api/attempts', requireAuth, attemptsRouter)

connectDB()

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`[server] API listening on http://localhost:${PORT}`))
}

export default app

