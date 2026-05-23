const User = require('../models/User.model');

// GET /api/leaderboard
const getLeaderboard = async (req, res) => {
  const { limit = 50 } = req.query;
  const leaders = await User.find({ isActive: true, role: 'user' })
    .select('name avatar xp level streak exam')
    .sort({ xp: -1 })
    .limit(parseInt(limit));

  // Add rank
  const ranked = leaders.map((u, i) => ({ rank: i + 1, ...u.toObject() }));

  // Find current user rank
  const userRank = ranked.findIndex((u) => u._id.toString() === req.user._id.toString()) + 1;

  res.json({ success: true, data: ranked, userRank: userRank || null });
};

module.exports = { getLeaderboard };
