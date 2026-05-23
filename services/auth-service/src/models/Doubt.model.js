const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 2000 },
  subject: { type: String, required: true },
  chapter: { type: String, default: '' },
  tags: [String],
  images: [String],
  answers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    body: { type: String, required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isAI: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['open', 'answered', 'closed'], default: 'open' },
  views: { type: Number, default: 0 },
}, { timestamps: true });

doubtSchema.index({ subject: 1, createdAt: -1 });
doubtSchema.index({ status: 1 });

module.exports = mongoose.model('Doubt', doubtSchema);
