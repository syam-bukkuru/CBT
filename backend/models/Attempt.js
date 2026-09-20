import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    type: { type: String, enum: ['MCQ', 'MSQ', 'NAT'], required: true },
    selectedIndex: { type: Number, default: null }, // MCQ
    selectedIndices: { type: [Number], default: [] }, // MSQ
    numericValue: { type: Number, default: null }, // NAT
    status: {
      type: String,
      enum: ['answered', 'marked', 'answered-marked', 'not-answered', 'not-visited'],
      default: 'not-visited',
    },
    timeSpentSeconds: { type: Number, default: 0 },
  },
  { _id: false },
)

const attemptSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Display snapshots — avoid a populate() on every leaderboard/history read.
  subjectName: { type: String, default: '' },
  topicName: { type: String, default: '' },
  testTitle: { type: String, default: '' },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  unattemptedCount: { type: Number, default: 0 },
  answers: { type: [answerSchema], default: [] },
  durationSeconds: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
})

attemptSchema.index({ testId: 1, score: -1, durationSeconds: 1 }) // leaderboard sort
attemptSchema.index({ testId: 1, userId: 1, score: -1 }) // "my best on this test"

export default mongoose.model('Attempt', attemptSchema)
