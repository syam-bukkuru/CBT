import { Router } from 'express'
import Subject from '../models/Subject.js'
import Topic from '../models/Topic.js'
import Test from '../models/Test.js'
import Attempt from '../models/Attempt.js'
import { isOwner } from '../lib/ownership.js'

const router = Router()

// GET /api/topics?subject=<subjectId>
router.get('/', async (req, res) => {
  try {
    const filter = {}
    if (req.query.subject) filter.subject = req.query.subject
    const topics = await Topic.find(filter).sort({ name: 1 }).populate('createdBy', 'name').lean()
    res.json(topics)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/topics  { subject, name, description }
router.post('/', async (req, res) => {
  try {
    const { subject, name, description = '' } = req.body || {}
    if (!subject) return res.status(400).json({ error: 'Subject is required' })
    if (!name || !name.trim()) return res.status(400).json({ error: 'Topic name is required' })

    const subjectDoc = await Subject.findById(subject)
    if (!subjectDoc) return res.status(404).json({ error: 'Subject not found' })

    const exists = await Topic.findOne({ subject, name: name.trim() })
    if (exists) return res.status(409).json({ error: 'A topic with that name already exists in this subject' })

    const topic = await Topic.create({
      subject,
      name: name.trim(),
      description,
      createdBy: req.user.id,
    })
    const populated = await Topic.findById(topic._id).populate('createdBy', 'name').lean()
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/topics/:id  -> creator-only rename/description
router.patch('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
    if (!topic) return res.status(404).json({ error: 'Topic not found' })
    if (!isOwner(topic, req.user.id)) {
      return res.status(403).json({ error: 'Only the creator can edit this topic' })
    }

    const { name, description } = req.body || {}
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Topic name is required' })
      const exists = await Topic.findOne({ subject: topic.subject, name: name.trim(), _id: { $ne: topic._id } })
      if (exists) return res.status(409).json({ error: 'A topic with that name already exists in this subject' })
      topic.name = name.trim()
    }
    if (description !== undefined) topic.description = description
    await topic.save()

    const populated = await Topic.findById(topic._id).populate('createdBy', 'name').lean()
    res.json(populated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/topics/:id  -> cascade: tests under it + their attempts
router.delete('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
    if (!topic) return res.status(404).json({ error: 'Topic not found' })
    if (!isOwner(topic, req.user.id)) {
      return res.status(403).json({ error: 'Only the creator can delete this topic' })
    }

    const tests = await Test.find({ topic: topic._id }).select('_id').lean()
    const testIds = tests.map((t) => t._id)
    await Attempt.deleteMany({ testId: { $in: testIds } })
    await Test.deleteMany({ topic: topic._id })
    await topic.deleteOne()

    res.json({ ok: true, deletedTests: testIds.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
