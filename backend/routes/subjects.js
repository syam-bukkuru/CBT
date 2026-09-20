import { Router } from 'express'
import Subject from '../models/Subject.js'
import Topic from '../models/Topic.js'
import Test from '../models/Test.js'
import Attempt from '../models/Attempt.js'
import { isOwner } from '../lib/ownership.js'

const router = Router()

// GET /api/subjects  -> all subjects sorted by name
router.get('/', async (_req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 }).populate('createdBy', 'name').lean()
    res.json(subjects)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/subjects  -> create a subject ("folder")
router.post('/', async (req, res) => {
  try {
    const { name, description = '', icon = 'Database' } = req.body || {}
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subject name is required' })
    }
    const exists = await Subject.findOne({ name: name.trim() })
    if (exists) {
      return res.status(409).json({ error: 'A subject with that name already exists' })
    }
    const subject = await Subject.create({ name: name.trim(), description, icon, createdBy: req.user.id })
    const populated = await Subject.findById(subject._id).populate('createdBy', 'name').lean()
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/subjects/:id  -> creator-only rename/description/icon
router.patch('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
    if (!subject) return res.status(404).json({ error: 'Subject not found' })
    if (!isOwner(subject, req.user.id)) {
      return res.status(403).json({ error: 'Only the creator can edit this subject' })
    }

    const { name, description, icon } = req.body || {}
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Subject name is required' })
      const exists = await Subject.findOne({ name: name.trim(), _id: { $ne: subject._id } })
      if (exists) return res.status(409).json({ error: 'A subject with that name already exists' })
      subject.name = name.trim()
    }
    if (description !== undefined) subject.description = description
    if (icon !== undefined) subject.icon = icon
    await subject.save()

    const populated = await Subject.findById(subject._id).populate('createdBy', 'name').lean()
    res.json(populated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/subjects/:id  -> cascade: topics + their tests + those tests' attempts
router.delete('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
    if (!subject) return res.status(404).json({ error: 'Subject not found' })
    if (!isOwner(subject, req.user.id)) {
      return res.status(403).json({ error: 'Only the creator can delete this subject' })
    }

    const tests = await Test.find({ subject: subject._id }).select('_id').lean()
    const testIds = tests.map((t) => t._id)
    await Attempt.deleteMany({ testId: { $in: testIds } })
    await Test.deleteMany({ subject: subject._id })
    await Topic.deleteMany({ subject: subject._id })
    await subject.deleteOne()

    res.json({ ok: true, deletedTests: testIds.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
