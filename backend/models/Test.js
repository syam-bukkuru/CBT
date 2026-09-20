import mongoose from 'mongoose'

// type-conditional fields:
//   MCQ -> options[] + correctIndex
//   MSQ -> options[] + correctIndices[]
//   NAT -> correctValue + tolerance (no options)
// Marks/negative marks live per-question (not per-test) so each question can be weighted independently.
const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['MCQ', 'MSQ', 'NAT'], default: 'MCQ' },
    text: { type: String, required: true },
    options: { type: [String], default: [] },
    correctIndex: { type: Number, default: null },
    correctIndices: { type: [Number], default: [] },
    correctValue: { type: Number, default: null },
    tolerance: { type: Number, default: 0 },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    explanation: { type: String, default: '' },
  },
  { _id: false },
)

const testSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
  title: { type: String, required: true },
  timeLimitMinutes: { type: Number, default: 30 },
  questions: { type: [questionSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
})

export default mongoose.model('Test', testSchema)
