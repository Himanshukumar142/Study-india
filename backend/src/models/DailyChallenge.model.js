const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // "2025-05-07"
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  subject: { type: String, default: 'Mixed' },
  bonusXP: { type: Number, default: 50 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'mixed' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
