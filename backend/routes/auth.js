import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

const router = Router()

function publicUser(u) {
  return { id: u._id, name: u.name, email: u.email }
}

// POST /api/auth/register  { name, email, password }
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' })
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' })
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) return res.status(409).json({ error: 'An account with that email already exists' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash })

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Could not start session' })
      req.session.user = publicUser(user)
      res.status(201).json(req.session.user)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const user = await User.findOne({ email: String(email).trim().toLowerCase() })
    const ok = user && (await bcrypt.compare(password, user.passwordHash))
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' })

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Could not start session' })
      req.session.user = publicUser(user)
      res.json(req.session.user)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Not authenticated' })
  res.json(req.session.user)
})

export default router
