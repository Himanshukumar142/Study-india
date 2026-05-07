const mongoose = require('mongoose');

const syllabusProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  chapter: { type: String, required: true },
  status: { type: String, enum: ['not-started', 'reading', 'done', 'revision'], default: 'not-started' },
  confidence: { type: Number, min: 0, max: 5, default: 0 }, // 0-5 stars
  notes: { type: String, default: '' },
  targetDate: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

syllabusProgressSchema.index({ userId: 1, subject: 1 });
syllabusProgressSchema.index({ userId: 1, subject: 1, chapter: 1 }, { unique: true });

module.exports = mongoose.model('SyllabusProgress', syllabusProgressSchema);
