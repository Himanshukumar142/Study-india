const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    durationMinutes: { type: Number, required: true, min: 0 },
    startPage: { type: Number, default: 1 },
    endPage: { type: Number, default: 1 },
    totalPages: { type: Number, default: 1 },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studySessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
