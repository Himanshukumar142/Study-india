const Challenge = require('../models/Challenge.model');
const User = require('../models/User.model');
const { getLevelFromXP } = require('../utils/xpEngine');

// GET /api/challenges
const getChallenges = async (req, res) => {
  const now = new Date();
  const challenges = await Challenge.find({ isActive: true, expiresAt: { $gt: now } })
    .sort({ createdAt: -1 });

  const withStatus = challenges.map((c) => ({
    ...c.toObject(),
    completed: c.completedBy.some((id) => id.toString() === req.user._id.toString()),
  }));

  res.json({ success: true, data: withStatus });
};

// POST /api/challenges/:id/complete
const completeChallenge = async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

  const alreadyDone = challenge.completedBy.some((id) => id.toString() === req.user._id.toString());
  if (alreadyDone) return res.status(409).json({ success: false, message: 'Already completed' });

  challenge.completedBy.push(req.user._id);
  await challenge.save();

  const user = await User.findById(req.user._id);
  user.xp += challenge.xpReward;
  user.level = getLevelFromXP(user.xp);
  await user.save();

  res.json({ success: true, message: 'Challenge completed!', xpGained: challenge.xpReward });
};

// POST /api/challenges  — admin create
const createChallenge = async (req, res) => {
  const challenge = await Challenge.create(req.body);
  res.status(201).json({ success: true, data: challenge });
};

module.exports = { getChallenges, completeChallenge, createChallenge };
