const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  title: { type: String, default: 'Untitled Resource' },
  description: { type: String, default: '' },
  type: { type: String, enum: ['video', 'pdf', 'image', 'document', 'audio', 'link', 'youtube'], default: 'link' },
  thumbnail: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: '' },
  subject: { type: String, default: '' },
  chapter: { type: String, default: '' },
  tags: [String],
  downloads: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

resourceSchema.index({ userId: 1, createdAt: -1 });
resourceSchema.index({ isPublic: 1, type: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
