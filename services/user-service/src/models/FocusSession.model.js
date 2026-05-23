const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timerDuration: { type: Number, required: true }, // minutes (15/25/45/60)
    actualDuration: { type: Number, required: true }, // minutes actually focused
    tabSwitches: { type: Number, default: 0 },
    windowBlurs: { type: Number, default: 0 },
    violations: { type: Number, default: 0 },
    focusScore: { type: Number, min: 0, max: 100, default: 100 },
    completed: { type: Boolean, default: false },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

focusSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FocusSession', focusSessionSchema);
