const User = require('../models/User.model');
const Content = require('../models/Content.model');
const QuizAttempt = require('../models/QuizAttempt.model');
const StudySession = require('../models/StudySession.model');
const FocusSession = require('../models/FocusSession.model');
const Mistake = require('../models/Mistake.model');

// GET /api/admin/stats
const getStats = async (req, res) => {
  const [totalUsers, totalContent, totalAttempts, totalStudySessions] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Content.countDocuments(),
    QuizAttempt.countDocuments(),
    StudySession.countDocuments(),
  ]);
  res.json({ success: true, data: { totalUsers, totalContent, totalAttempts, totalStudySessions } });
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = { role: 'user' };
  if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// PATCH /api/admin/users/:id/toggle
const toggleUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: { isActive: user.isActive } });
};

// GET /api/admin/content
const getContent = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [contents, total] = await Promise.all([
    Content.find(filter).populate('uploadedBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Content.countDocuments(filter),
  ]);
  res.json({ success: true, data: contents, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// DELETE /api/admin/content/:id
const deleteContent = async (req, res) => {
  const { deleteFromB2 } = require('../utils/b2Upload');
  const content = await Content.findById(req.params.id);
  if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
  await deleteFromB2(content.fileId, content.fileName);
  await content.deleteOne();
  res.json({ success: true, message: 'Content deleted' });
};

// GET /api/admin/users/:id/performance
const getUserPerformance = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId).select('-password -refreshToken');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const [quizAttempts, studySessions, focusSessions, mistakeCount] = await Promise.all([
    QuizAttempt.find({ userId }).sort({ createdAt: -1 }).limit(10).populate('questions', 'subject chapter'),
    StudySession.find({ userId }).sort({ createdAt: -1 }).limit(10).populate('contentId', 'title type'),
    FocusSession.find({ userId }).sort({ createdAt: -1 }).limit(10),
    Mistake.countDocuments({ userId }),
  ]);

  const stats = {
    totalXP: user.xp,
    level: user.level,
    exam: user.exam,
    mistakes: mistakeCount,
  };

  res.json({ success: true, data: { user: stats, quizAttempts, studySessions, focusSessions } });
};

// GET /api/admin/analytics/performance
const getPlatformPerformance = async (req, res) => {
  const [totalAttempts, totalMistakes, topUsers] = await Promise.all([
    QuizAttempt.aggregate([
      { $group: { _id: null, avgAccuracy: { $avg: "$accuracy" }, totalMarks: { $sum: "$obtainedMarks" } } }
    ]),
    Mistake.countDocuments(),
    User.find({ role: 'user' }).sort({ xp: -1 }).limit(10).select('name xp level avatar')
  ]);

  const subjectStats = await QuizAttempt.aggregate([
    { $group: { _id: "$subject", count: { $sum: 1 }, avgMarks: { $avg: "$obtainedMarks" } } }
  ]);

  res.json({
    success: true,
    data: {
      overall: totalAttempts[0] || { avgAccuracy: 0, totalMarks: 0 },
      mistakes: totalMistakes,
      topUsers,
      subjectStats
    }
  });
};

module.exports = { getStats, getUsers, toggleUser, getContent, deleteContent, getUserPerformance, getPlatformPerformance };
