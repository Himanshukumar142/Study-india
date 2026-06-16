const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mockTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' },
    subject: { type: String, default: 'Mock Test' },
    chapter: { type: String, default: 'Multiple' },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOption: { type: String, default: null }, // removed enum for numerical/multi support
        isCorrect: { type: Boolean, default: false },
        timeTakenSeconds: { type: Number, default: 0 },
      },
    ],
    mode: { type: String, enum: ['practice', 'test', 'exam', 'challenge', 'ai'], default: 'practice' },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    timeTakenSeconds: { type: Number, default: 0 },
    xpAwarded: { type: Number, default: 0 },
    violations: { type: Number, default: 0 },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
