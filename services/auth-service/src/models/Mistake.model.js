const mongoose = require('mongoose');

const mistakeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    subject: { type: String, required: true },
    chapter: { type: String, required: true },
    selectedOption: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
    revisited: { type: Boolean, default: false },
    revisedAt: { type: Date, default: null },
    attemptCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Unique mistake per user per question
mistakeSchema.index({ userId: 1, questionId: 1 }, { unique: true });
mistakeSchema.index({ userId: 1, subject: 1, chapter: 1 });

module.exports = mongoose.model('Mistake', mistakeSchema);
