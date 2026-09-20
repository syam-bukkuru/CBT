import { Router } from 'express'
import Test from '../models/Test.js'
import Attempt from '../models/Attempt.js'
import { isOwner } from '../lib/ownership.js'

const router = Router()

function sanitizeQuestions(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((q) => {
      const type = ['MCQ', 'MSQ', 'NAT'].includes(q.type) ? q.type : 'MCQ'
      const text = String(q.text ?? '').trim()
      const marks = Number(q.marks)
      const negativeMarks = Number(q.negativeMarks)
      const common = {
        type,
        text,
        marks: Number.isFinite(marks) && marks > 0 ? marks : 1,
        negativeMarks: Number.isFinite(negativeMarks) && negativeMarks >= 0 ? negativeMarks : 0,
        explanation: String(q.explanation ?? '').trim(),
      }

      if (type === 'NAT') {
        const correctValue = Number(q.correctValue)
        if (!Number.isFinite(correctValue)) return null // can't default a numeric answer
        const tolerance = Number(q.tolerance)
        return {
          ...common,
          options: [],
          correctIndex: null,
          correctIndices: [],
          correctValue,
          tolerance: Number.isFinite(tolerance) && tolerance >= 0 ? tolerance : 0,
        }
      }

      const options = Array.isArray(q.options)
        ? q.options.map((o) => String(o ?? '').trim()).filter((o) => o.length > 0)
        : []
      if (options.length < 2) return null

      if (type === 'MSQ') {
        let correctIndices = Array.isArray(q.correctIndices)
          ? [...new Set(q.correctIndices.filter((i) => Number.isInteger(i) && i >= 0 && i < options.length))]
          : []
        if (correctIndices.length === 0) correctIndices = [0]
        return { ...common, options, correctIndex: null, correctIndices, correctValue: null, tolerance: 0 }
      }

      // MCQ
      let correctIndex = Number.isInteger(q.correctIndex) ? q.correctIndex : 0
      if (correctIndex < 0 || correctIndex >= options.length) correctIndex = 0
      return { ...common, options, correctIndex, correctIndices: [], correctValue: null, tolerance: 0 }
    })
    .filter((q) => q && q.text.length > 0)
}

// GET /api/tests?subject=<id>&topic=<id>
router.get('/', async (req, res) => {
  try {
    const filter = {}
    if (req.query.subject) filter.subject = req.query.subject
    if (req.query.topic) filter.topic = req.query.topic
    const tests = await Test.find(filter)
      .sort({ createdAt: -1 })
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('createdBy', 'name')
      .lean()
    res.json(tests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tests/:id
router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('createdBy', 'name')
      .lean()
    if (!test) return res.status(404).json({ error: 'Test not found' })
    const hasAttempts = await Attempt.exists({ testId: test._id })
    res.json({ ...test, hasAttempts: Boolean(hasAttempts) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tests/:id/leaderboard -> best attempt per user, ranked
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).select('_id').lean()
    if (!test) return res.status(404).json({ error: 'Test not found' })

    const rows = await Attempt.aggregate([
      { $match: { testId: test._id } },
      { $sort: { score: -1, durationSeconds: 1, submittedAt: 1 } },
      {
        $group: {
          _id: '$userId',
          best: { $first: '$$ROOT' },
          attemptsCount: { $sum: 1 },
        },
      },
      { $sort: { 'best.score': -1, 'best.durationSeconds': 1, 'best.submittedAt': 1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          score: '$best.score',
          total: '$best.total',
          durationSeconds: '$best.durationSeconds',
          submittedAt: '$best.submittedAt',
          attemptsCount: 1,
        },
      },
    ])

    const leaderboard = rows.map((r, i) => ({ ...r, rank: i + 1 }))
    res.json(leaderboard)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tests
router.post('/', async (req, res) => {
  try {
    const { subject, topic, title, timeLimitMinutes = 30, questions } = req.body || {}

    if (!subject) return res.status(400).json({ error: 'Subject is required' })
    if (!topic) return res.status(400).json({ error: 'Topic is required' })
    if (!title || !title.trim()) return res.status(400).json({ error: 'Test title is required' })

    const cleanQuestions = sanitizeQuestions(questions)
    if (cleanQuestions.length === 0) {
      return res.status(400).json({ error: 'At least one valid question is required' })
    }

    const test = await Test.create({
      subject,
      topic,
      title: title.trim(),
      timeLimitMinutes: Number(timeLimitMinutes) || 30,
      questions: cleanQuestions,
      createdBy: req.user.id,
    })
    const populated = await Test.findById(test._id)
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('createdBy', 'name')
      .lean()
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/tests/:id  -> creator-only. title/timeLimitMinutes always editable;
// questions are locked once an attempt exists, to protect scoring/leaderboard history.
router.patch('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
    if (!test) return res.status(404).json({ error: 'Test not found' })
    if (!isOwner(test, req.user.id)) {
      return res.status(403).json({ error: 'Only the creator can edit this test' })
    }

    const { title, timeLimitMinutes, questions } = req.body || {}
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Test title is required' })
      test.title = title.trim()
    }
    if (timeLimitMinutes !== undefined) {
      test.timeLimitMinutes = Number(timeLimitMinutes) || test.timeLimitMinutes
    }
    if (questions !== undefined) {
      const hasAttempts = await Attempt.exists({ testId: test._id })
      if (hasAttempts) {
        return res.status(409).json({ error: 'This test already has attempts — questions are locked to protect scoring history' })
      }
      const cleanQuestions = sanitizeQuestions(questions)
      if (cleanQuestions.length === 0) {
        return res.status(400).json({ error: 'At least one valid question is required' })
      }
      test.questions = cleanQuestions
    }
    await test.save()

    const populated = await Test.findById(test._id)
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('createdBy', 'name')
      .lean()
    res.json(populated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/tests/:id  -> remove test + its attempts
router.delete('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
    if (!test) return res.status(404).json({ error: 'Test not found' })
    if (!isOwner(test, req.user.id)) {
      return res.status(403).json({ error: 'Only the creator can delete this test' })
    }
    await Attempt.deleteMany({ testId: test._id })
    await test.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
