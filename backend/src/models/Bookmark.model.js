const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['content', 'question'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemModel' },
    itemModel: { type: String, required: true, enum: ['Content', 'Question'] },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

bookmarkSchema.index({ userId: 1, type: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
