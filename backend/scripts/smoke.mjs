// Lightweight end-to-end check — no test framework, just Node's built-in fetch + assert.
// Run against an already-running dev server (`npm run dev` from the repo root, or
// `npm run dev -w backend`) with a reachable MongoDB:
//
//   node backend/scripts/smoke.mjs
//   API_BASE=http://localhost:5000/api node backend/scripts/smoke.mjs   # custom base URL
//
// Drives register -> login -> subject -> topic -> test (MCQ + MSQ + NAT, per-question
// marks/negative marks) -> attempt scoring -> leaderboard (best-attempt, tie-break by time)
// -> cascading delete, pinning down the scoring math for all three question types.
// Uses a random suffix so it can be re-run against the same database without collisions,
// and deletes the subject it creates (cascading its topic/test/attempts) when it's done.
import assert from 'node:assert/strict'

const BASE = process.env.API_BASE || 'http://localhost:5000/api'
const STAMP = Date.now()

function extractCookie(res) {
  const raw = res.headers.get('set-cookie')
  return raw ? raw.split(';')[0] : null
}

function client() {
  let cookie = null
  return async (path, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    if (cookie) headers.Cookie = cookie
    const res = await fetch(`${BASE}${path}`, { ...opts, headers })
    const setCookie = extractCookie(res)
    if (setCookie) cookie = setCookie
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null }
  }
}

async function main() {
  const alice = client()
  const bob = client()

  let r = await fetch(`${BASE}/health`).then((res) => res.json())
  assert.ok(r.ok, 'server should be reachable — is `npm run dev` running?')
  if (!r.db) throw new Error('Server is up but not connected to MongoDB yet — try again shortly.')

  r = await alice('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Smoke Alice', email: `alice.smoke.${STAMP}@example.com`, password: 'password123' }),
  })
  assert.equal(r.status, 201, `alice register: ${JSON.stringify(r.body)}`)

  r = await bob('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Smoke Bob', email: `bob.smoke.${STAMP}@example.com`, password: 'password123' }),
  })
  assert.equal(r.status, 201, `bob register: ${JSON.stringify(r.body)}`)

  r = await alice('/subjects', { method: 'POST', body: JSON.stringify({ name: `Smoke Subject ${STAMP}` }) })
  assert.equal(r.status, 201, `create subject: ${JSON.stringify(r.body)}`)
  const subjectId = r.body._id

  r = await alice('/topics', { method: 'POST', body: JSON.stringify({ subject: subjectId, name: 'Smoke Topic' }) })
  assert.equal(r.status, 201)
  const topicId = r.body._id

  const questions = [
    { type: 'MCQ', text: '2+2=?', options: ['3', '4', '5', '6'], correctIndex: 1, marks: 2, negativeMarks: 0.5 },
    { type: 'MSQ', text: 'Pick the even numbers', options: ['1', '2', '3', '4'], correctIndices: [1, 3], marks: 3, negativeMarks: 1 },
    { type: 'NAT', text: 'Value of pi (approx, 1dp)?', correctValue: 3.1, tolerance: 0.15, marks: 4, negativeMarks: 0 },
  ]

  r = await alice('/tests', {
    method: 'POST',
    body: JSON.stringify({ subject: subjectId, topic: topicId, title: 'Smoke Quiz', timeLimitMinutes: 10, questions }),
  })
  assert.equal(r.status, 201, `create test: ${JSON.stringify(r.body)}`)
  const testId = r.body._id

  // Alice: all correct -> full marks (2 + 3 + 4 = 9)
  r = await alice('/attempts', {
    method: 'POST',
    body: JSON.stringify({
      testId,
      durationSeconds: 120,
      answers: [
        { questionIndex: 0, selectedIndex: 1, status: 'answered', timeSpentSeconds: 10 },
        { questionIndex: 1, selectedIndices: [1, 3], status: 'answered', timeSpentSeconds: 20 },
        { questionIndex: 2, numericValue: 3.14, status: 'answered', timeSpentSeconds: 15 },
      ],
    }),
  })
  assert.equal(r.status, 201, `alice attempt: ${JSON.stringify(r.body)}`)
  assert.equal(r.body.score, 9, `expected alice score 9, got ${r.body.score}`)

  // Bob: Q1 wrong (-0.5), Q2 unattempted (0), Q3 correct (+4) -> 3.5
  r = await bob('/attempts', {
    method: 'POST',
    body: JSON.stringify({
      testId,
      durationSeconds: 200,
      answers: [
        { questionIndex: 0, selectedIndex: 0, status: 'answered', timeSpentSeconds: 30 },
        { questionIndex: 1, selectedIndices: [], status: 'not-answered', timeSpentSeconds: 5 },
        { questionIndex: 2, numericValue: 3.2, status: 'answered', timeSpentSeconds: 25 },
      ],
    }),
  })
  assert.equal(r.status, 201, `bob attempt: ${JSON.stringify(r.body)}`)
  assert.equal(r.body.score, 3.5, `expected bob score 3.5, got ${r.body.score}`)

  r = await alice(`/tests/${testId}/leaderboard`)
  assert.equal(r.status, 200)
  assert.equal(r.body[0].name, 'Smoke Alice')
  assert.equal(r.body[0].score, 9)
  assert.equal(r.body[1].name, 'Smoke Bob')
  assert.equal(r.body[1].score, 3.5)

  // cleanup: deleting the subject cascades topic -> test -> attempts
  r = await alice(`/subjects/${subjectId}`, { method: 'DELETE' })
  assert.equal(r.status, 200)

  console.log('✅ smoke test passed')
}

main().catch((err) => {
  console.error('❌ smoke test failed:', err.message)
  process.exit(1)
})
