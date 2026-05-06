const StudySession = require('../models/StudySession.model');
const FocusSession = require('../models/FocusSession.model');
const QuizAttempt = require('../models/QuizAttempt.model');
const Mistake = require('../models/Mistake.model');
const User = require('../models/User.model');

// GET /api/analytics/dashboard
const getDashboard = async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [user, dailyStudy, recentQuizzes, totalMistakes, focusSessions] = await Promise.all([
    User.findById(userId),
    StudySession.aggregate([
      { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, minutes: { $sum: '$durationMinutes' } } },
      { $sort: { _id: 1 } },
    ]),
    QuizAttempt.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }).limit(10),
    Mistake.countDocuments({ userId, revisited: false }),
    FocusSession.aggregate([
      { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: null, avgFocusScore: { $avg: '$focusScore' }, totalSessions: { $sum: 1 } } },
    ]),
  ]);

  const subjectPerformance = await QuizAttempt.aggregate([
    { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: '$subject', avgAccuracy: { $avg: '$accuracy' }, attempts: { $sum: 1 } } },
    { $sort: { avgAccuracy: -1 } },
  ]);

  const totalQuizzesSolved = recentQuizzes.reduce((sum, a) => sum + a.answers.length, 0);
  const avgAccuracy = recentQuizzes.length > 0
    ? Math.round(recentQuizzes.reduce((s, a) => s + a.accuracy, 0) / recentQuizzes.length)
    : 0;

  res.json({
    success: true,
    data: {
      user: {
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        totalStudyMinutes: user.totalStudyMinutes,
      },
      dailyStudy,
      subjectPerformance,
      totalMistakes,
      avgFocusScore: focusSessions[0]?.avgFocusScore?.toFixed(1) || 0,
      totalQuizzesSolved,
      avgAccuracy,
      weakTopics: user.weakTopics,
    },
  });
};

// GET /api/analytics/study-time
const getStudyTime = async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const data = await StudySession.aggregate([
    { $match: { userId: req.user._id, createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, minutes: { $sum: '$durationMinutes' } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data });
};

module.exports = { getDashboard, getStudyTime };
