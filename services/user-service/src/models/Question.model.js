const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    chapter: { type: String, required: true },
    topic: { type: String, default: '' },
    exam: { type: String, enum: ['JEE', 'NEET', 'BOTH'], default: 'BOTH' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    type: { type: String, enum: ['mcq', 'multi', 'numerical'], default: 'mcq' },
    question: { type: String, required: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correct: { type: String, required: true }, // Removed enum to support numerical answers or multiple options (e.g. "A,B")
    explanation: { type: String, default: '' },
    negativeMarking: { type: Number, default: -0.25 },
    marks: { type: Number, default: 4 },
    imageUrl: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

questionSchema.index({ subject: 1, chapter: 1, exam: 1 });

module.exports = mongoose.model('Question', questionSchema);
