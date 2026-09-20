import mongoose from 'mongoose'

const topicSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
})

// A subject can't have two topics with the same name.
topicSchema.index({ subject: 1, name: 1 }, { unique: true })

export default mongoose.model('Topic', topicSchema)
