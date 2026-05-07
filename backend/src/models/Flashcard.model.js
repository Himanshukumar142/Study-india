const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  chapter: { type: String, default: '' },
  front: { type: String, required: true, maxlength: 500 },
  back: { type: String, required: true, maxlength: 1000 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  nextReview: { type: Date, default: Date.now },
  interval: { type: Number, default: 1 }, // days
  easeFactor: { type: Number, default: 2.5 },
  reviewCount: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: false },
  tags: [String],
}, { timestamps: true });

flashcardSchema.index({ userId: 1, subject: 1 });
flashcardSchema.index({ userId: 1, nextReview: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
