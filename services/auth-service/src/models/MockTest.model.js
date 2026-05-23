const mongoose = require('mongoose');

const mockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    exam: { type: String, enum: ['JEE', 'NEET', 'BOTH'], required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true }, // in minutes
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

mockTestSchema.index({ startTime: 1, status: 1 });

module.exports = mongoose.model('MockTest', mockTestSchema);
