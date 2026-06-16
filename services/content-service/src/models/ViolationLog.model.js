const mongoose = require('mongoose');

const violationLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt', required: true },
    violationType: { 
      type: String, 
      enum: ['tab-switch', 'fullscreen-exit', 'window-blur', 'other'], 
      required: true 
    },
    timestamp: { type: Date, default: Date.now },
    details: { type: String, default: '' },
  },
  { timestamps: true }
);

violationLogSchema.index({ attemptId: 1, userId: 1 });
violationLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ViolationLog', violationLogSchema);
