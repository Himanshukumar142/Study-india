const { UserBadge, BADGE_DEFINITIONS } = require('../models/Badge.model');
const QuizAttempt = require('../models/QuizAttempt.model');
const User = require('../models/User.model');

// Award a badge (idempotent — won't duplicate)
const awardBadge = async (userId, badgeId) => {
  try {
    const def = BADGE_DEFINITIONS.find(b => b.id === badgeId);
    if (!def) return null;
    const badge = await UserBadge.create({ userId, badgeId });
    // Award XP if badge has xp
    if (def.xp > 0) await User.findByIdAndUpdate(userId, { $inc: { xp: def.xp } });
    return { ...def, earnedAt: badge.earnedAt };
  } catch (err) {
    if (err.code === 11000) return null; // already awarded
    throw err;
  }
};

// Check and award all applicable badges for a user
const checkAndAwardBadges = async (userId) => {
  const awarded = [];
  const existing = await UserBadge.find({ userId }).select('badgeId');
  const ownedIds = new Set(existing.map(b => b.badgeId));

  const attempts = await QuizAttempt.find({ userId, status: 'completed' });
  const user = await User.findById(userId);
  if (!user) return [];

  const totalQuizzes = attempts.length;
  const totalCorrect = attempts.reduce((s, a) => s + (a.correct || 0), 0) + attempts.reduce((s, a) => s + (a.wrong || 0), 0) + attempts.reduce((s, a) => s + (a.skipped || 0), 0);
  const perfectScores = attempts.filter(a => a.accuracy === 100).length;
  const high80 = attempts.filter(a => a.accuracy >= 80).length;
  const userXP = user.xp || 0;
  const streak = user.streak || 0;

  const physicsQ = attempts.filter(a => a.subject === 'Physics').length;
  const chemQ = attempts.filter(a => a.subject === 'Chemistry').length;
  const mathQ = attempts.filter(a => a.subject === 'Mathematics').length;
  const bioQ = attempts.filter(a => a.subject === 'Biology').length;

  const dailyChallenges = attempts.filter(a => a.subject === 'Daily Challenge').length;

  const checks = [
    { id: 'streak_3',    cond: streak >= 3    },
    { id: 'streak_7',    cond: streak >= 7    },
    { id: 'streak_30',   cond: streak >= 30   },
    { id: 'streak_100',  cond: streak >= 100  },
    { id: 'quiz_1',      cond: totalQuizzes >= 1   },
    { id: 'quiz_10',     cond: totalQuizzes >= 10  },
    { id: 'quiz_50',     cond: totalQuizzes >= 50  },
    { id: 'quiz_100',    cond: totalQuizzes >= 100 },
    { id: 'perfect_1',   cond: perfectScores >= 1 },
    { id: 'perfect_5',   cond: perfectScores >= 5 },
    { id: 'score_80',    cond: high80 >= 10 },
    { id: 'q_100',       cond: totalCorrect >= 100  },
    { id: 'q_500',       cond: totalCorrect >= 500  },
    { id: 'q_1000',      cond: totalCorrect >= 1000 },
    { id: 'physics_pro', cond: physicsQ >= 20 },
    { id: 'chem_pro',    cond: chemQ >= 20    },
    { id: 'math_pro',    cond: mathQ >= 20    },
    { id: 'bio_pro',     cond: bioQ >= 20     },
    { id: 'xp_500',      cond: userXP >= 500   },
    { id: 'xp_2000',     cond: userXP >= 2000  },
    { id: 'xp_10000',    cond: userXP >= 10000 },
    { id: 'daily_1',     cond: dailyChallenges >= 1 },
    { id: 'daily_7',     cond: dailyChallenges >= 7 },
  ];

  for (const { id, cond } of checks) {
    if (cond && !ownedIds.has(id)) {
      const result = await awardBadge(userId, id);
      if (result) awarded.push(result);
    }
  }

  return awarded;
};

// GET /api/badges
const getBadges = async (req, res) => {
  const userBadges = await UserBadge.find({ userId: req.user._id }).sort({ earnedAt: -1 });
  const ownedIds = new Set(userBadges.map(b => b.badgeId));
  const earnedAtMap = {};
  userBadges.forEach(b => earnedAtMap[b.badgeId] = b.earnedAt);

  const allBadges = BADGE_DEFINITIONS.map(def => ({
    ...def,
    owned: ownedIds.has(def.id),
    earnedAt: ownedIds.has(def.id) ? earnedAtMap[def.id] : null,
  }));

  res.json({
    success: true,
    data: allBadges,
    stats: {
      total: BADGE_DEFINITIONS.length,
      owned: userBadges.length,
      pct: Math.round((userBadges.length / BADGE_DEFINITIONS.length) * 100),
    },
  });
};

// POST /api/badges/check — trigger badge check after events
const checkBadges = async (req, res) => {
  const newBadges = await checkAndAwardBadges(req.user._id);
  res.json({ success: true, newBadges });
};

// Manual award (for special badges like night_owl, early_bird)
const awardSpecialBadge = async (req, res) => {
  const { badgeId } = req.body;
  const special = ['night_owl', 'early_bird', 'flashcard_1', 'notes_5', 'doubt_1', 'syllabus_25', 'syllabus_50', 'syllabus_100'];
  if (!special.includes(badgeId)) return res.status(400).json({ success: false, message: 'Invalid badge' });
  const result = await awardBadge(req.user._id, badgeId);
  res.json({ success: true, data: result, alreadyOwned: !result });
};

module.exports = { getBadges, checkBadges, awardSpecialBadge, checkAndAwardBadges, awardBadge };
