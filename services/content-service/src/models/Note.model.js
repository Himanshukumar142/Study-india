const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, default: '' },
  subject: { type: String, default: '' },
  chapter: { type: String, default: '' },
  tags: [String],
  color: { type: String, default: '#ffffff' },
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

noteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model('Note', noteSchema);
