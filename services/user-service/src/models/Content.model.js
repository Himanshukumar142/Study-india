const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    chapter: { type: String, required: true, trim: true },
    topic: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    fileId: { type: String, required: true },   // B2 fileId for deletion
    fileName: { type: String, required: true },  // B2 file path/key
    fileSize: { type: Number, required: true },
    fileType: { type: String, enum: ['pdf', 'image'], required: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    tags: [{ type: String, trim: true }],
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

contentSchema.index({ subject: 1, chapter: 1 });
contentSchema.index({ title: 'text', subject: 'text', chapter: 'text', topic: 'text' });

module.exports = mongoose.model('Content', contentSchema);
