const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    xpReward: { type: Number, default: 50 },
    expiresAt: { type: Date, required: true },
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    subject: { type: String, default: '' },
    chapter: { type: String, default: '' },
    targetCount: { type: Number, default: 1 }, // e.g. solve 10 questions
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

challengeSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Challenge', challengeSchema);
