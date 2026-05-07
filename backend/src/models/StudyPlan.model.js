const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // "2025-05-07"
  tasks: [{
    subject: { type: String, required: true },
    chapter: { type: String, default: '' },
    description: { type: String, required: true },
    duration: { type: Number, default: 60 }, // minutes
    completed: { type: Boolean, default: false },
    completedAt: Date,
  }],
  totalPlanned: { type: Number, default: 0 }, // minutes
  totalCompleted: { type: Number, default: 0 },
  note: { type: String, default: '' },
}, { timestamps: true });

studyPlanSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
