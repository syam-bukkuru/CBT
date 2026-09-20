// Thin fetch wrappers over the Express API (proxied at /api by Vite).
// Session auth is cookie-based (httpOnly), so no token plumbing is needed here —
// `credentials: 'same-origin'` is enough for the browser to attach it.

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function req(path, options) {
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(msg, res.status)
  }
  if (res.status === 204) return null
  return res.json()
}

// --- auth ---
export const register = (payload) => req('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
export const login = (payload) => req('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
export const logout = () => req('/auth/logout', { method: 'POST' })
export const getMe = () => req('/auth/me')

// --- subjects ---
export const getSubjects = () => req('/subjects')
export const createSubject = (payload) =>
  req('/subjects', { method: 'POST', body: JSON.stringify(payload) })
export const updateSubject = (id, payload) =>
  req(`/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteSubject = (id) => req(`/subjects/${id}`, { method: 'DELETE' })

// --- topics ---
export const getTopics = (subjectId) =>
  req(`/topics${subjectId ? `?subject=${encodeURIComponent(subjectId)}` : ''}`)
export const createTopic = (payload) =>
  req('/topics', { method: 'POST', body: JSON.stringify(payload) })
export const updateTopic = (id, payload) =>
  req(`/topics/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteTopic = (id) => req(`/topics/${id}`, { method: 'DELETE' })

// --- tests ---
export const getTests = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.subject) qs.set('subject', params.subject)
  if (params.topic) qs.set('topic', params.topic)
  const s = qs.toString()
  return req(`/tests${s ? `?${s}` : ''}`)
}
export const getTest = (id) => req(`/tests/${id}`)
export const createTest = (payload) => req('/tests', { method: 'POST', body: JSON.stringify(payload) })
export const updateTest = (id, payload) =>
  req(`/tests/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteTest = (id) => req(`/tests/${id}`, { method: 'DELETE' })
export const getLeaderboard = (testId) => req(`/tests/${testId}/leaderboard`)

// --- attempts ---
export const getAttempts = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.testId) qs.set('testId', params.testId)
  if (params.mine) qs.set('mine', 'true')
  const s = qs.toString()
  return req(`/attempts${s ? `?${s}` : ''}`)
}
export const getAttempt = (id) => req(`/attempts/${id}`)
export const createAttempt = (payload) =>
  req('/attempts', { method: 'POST', body: JSON.stringify(payload) })
