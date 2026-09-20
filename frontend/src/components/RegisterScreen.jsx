import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { useAuth } from '../AuthContext.jsx'

export default function RegisterScreen() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setBusy(true)
    try {
      await register(name.trim(), email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not create your account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-main)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-sm tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> CBT PORTAL
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">Join your group's practice portal</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-main)]">Create account</h2>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Your name</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)]"
              placeholder="e.g. Priya Sharma"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)]"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full text-sm">
            <UserPlus className="w-4 h-4" /> {busy ? 'Creating…' : 'Create account'}
          </button>

          <p className="text-xs text-center text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
