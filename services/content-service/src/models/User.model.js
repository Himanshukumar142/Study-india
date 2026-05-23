const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    exam: { type: String, enum: ['JEE', 'NEET', 'BOTH'], default: 'JEE' },
    class: { type: String, enum: ['11', '12', 'Dropper'], default: '11' },
    goals: { type: String, default: '' },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    refreshToken: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    totalStudyMinutes: { type: Number, default: 0 },
    weakTopics: [{ subject: String, chapter: String, topic: String }],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update streak based on lastActive
userSchema.methods.updateStreak = function () {
  const now = new Date();
  const last = new Date(this.lastActive);
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) {
    this.streak += 1;
  } else if (diffDays > 1) {
    this.streak = 1;
  }
  this.lastActive = now;
};

module.exports = mongoose.model('User', userSchema);
