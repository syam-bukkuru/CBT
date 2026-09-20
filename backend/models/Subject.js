import mongoose from 'mongoose'

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, enum: ['Database', 'Cpu', 'BookOpen'], default: 'Database' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('Subject', subjectSchema)
