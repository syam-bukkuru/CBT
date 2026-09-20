import { Router } from 'express'
import Test from '../models/Test.js'
import Attempt from '../models/Attempt.js'

const router = Router()

// GET /api/attempts?testId=xxx&mine=true
router.get('/', async (req, res) => {
  try {
    const filter = {}
    if (req.query.testId) filter.testId = req.query.testId
    if (req.query.mine === 'true') filter.userId = req.user.id
    const attempts = await Attempt.find(filter).sort({ submittedAt: -1 }).lean()
    res.json(attempts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/attempts/:id
router.get('/:id', async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id).lean()
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' })
    res.json(attempt)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function isCorrect(question, answer) {
  if (question.type === 'MSQ') {
    const got = [...new Set(answer.selectedIndices || [])].sort((a, b) => a - b)
    const want = [...new Set(question.correctIndices || [])].sort((a, b) => a - b)
    return got.length > 0 && got.length === want.length && got.every((v, i) => v === want[i])
  }
  if (question.type === 'NAT') {
    if (answer.numericValue === null || answer.numericValue === undefined) return false
    return Math.abs(answer.numericValue - question.correctValue) <= (question.tolerance || 0)
  }
  // MCQ
  return answer.selectedIndex !== null && answer.selectedIndex === question.correctIndex
}

function isUnattempted(question, answer) {
  if (question.type === 'MSQ') return !answer.selectedIndices || answer.selectedIndices.length === 0
  if (question.type === 'NAT') return answer.numericValue === null || answer.numericValue === undefined
  return answer.selectedIndex === null || answer.selectedIndex === undefined
}

// POST /api/attempts  -> score is recomputed server-side from the test (never trusts the client)
router.post('/', async (req, res) => {
  try {
    const { testId, answers = [], durationSeconds = 0 } = req.body || {}
    const test = await Test.findById(testId)
      .populate('subject', 'name')
      .populate('topic', 'name')
      .lean()
    if (!test) return res.status(404).json({ error: 'Test not found' })

    const byIndex = new Map()
    for (const a of answers) {
      if (Number.isInteger(a.questionIndex)) byIndex.set(a.questionIndex, a)
    }

    let correctCount = 0
    let wrongCount = 0
    let unattemptedCount = 0
    let score = 0
    let total = 0

    const normalized = test.questions.map((q, i) => {
      total += q.marks
      const a = byIndex.get(i) || {}
      const selectedIndex = Number.isInteger(a.selectedIndex) ? a.selectedIndex : null
      const selectedIndices = Array.isArray(a.selectedIndices)
        ? a.selectedIndices.filter((v) => Number.isInteger(v))
        : []
      const numericValue = typeof a.numericValue === 'number' && Number.isFinite(a.numericValue) ? a.numericValue : null
      const answer = { selectedIndex, selectedIndices, numericValue }

      let status = a.status || 'not-visited'
      const unattempted = isUnattempted(q, answer)

      if (unattempted) {
        unattemptedCount += 1
        if (status === 'answered' || status === 'answered-marked') status = 'not-answered'
      } else if (isCorrect(q, answer)) {
        correctCount += 1
        score += q.marks
      } else {
        wrongCount += 1
        score -= q.negativeMarks
      }

      const timeSpentSeconds = Number(a.timeSpentSeconds)

      return {
        questionIndex: i,
        type: q.type,
        selectedIndex,
        selectedIndices,
        numericValue,
        status,
        timeSpentSeconds: Number.isFinite(timeSpentSeconds) && timeSpentSeconds >= 0 ? timeSpentSeconds : 0,
      }
    })

    score = Math.round(score * 100) / 100

    const attempt = await Attempt.create({
      testId: test._id,
      userId: req.user.id,
      subjectName: test.subject?.name || '',
      topicName: test.topic?.name || '',
      testTitle: test.title,
      score,
      total,
      correctCount,
      wrongCount,
      unattemptedCount,
      answers: normalized,
      durationSeconds: Number(durationSeconds) || 0,
    })

    res.status(201).json(attempt)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
