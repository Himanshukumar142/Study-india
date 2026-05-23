const Mistake = require('../models/Mistake.model');
const User = require('../models/User.model');
const { calculateXP, getLevelFromXP } = require('../utils/xpEngine');

// GET /api/mistakes
const getMistakes = async (req, res) => {
  const { subject, chapter, revisited } = req.query;
  const filter = { userId: req.user._id };
  if (subject) filter.subject = new RegExp(subject, 'i');
  if (chapter) filter.chapter = new RegExp(chapter, 'i');
  if (revisited !== undefined) filter.revisited = revisited === 'true';

  const mistakes = await Mistake.find(filter)
    .populate('questionId')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: mistakes });
};

// PATCH /api/mistakes/:id/revise
const markRevised = async (req, res) => {
  const mistake = await Mistake.findOne({ _id: req.params.id, userId: req.user._id });
  if (!mistake) return res.status(404).json({ success: false, message: 'Mistake not found' });

  mistake.revisited = true;
  mistake.revisedAt = new Date();
  await mistake.save();

  // Award XP for revision
  const xpGained = calculateXP('REVISE_MISTAKE');
  const user = await User.findById(req.user._id);
  user.xp += xpGained;
  user.level = getLevelFromXP(user.xp);
  await user.save();

  res.json({ success: true, message: 'Marked as revised', xpGained });
};

// GET /api/mistakes/grouped  — group by subject/chapter
const getGrouped = async (req, res) => {
  const grouped = await Mistake.aggregate([
    { $match: { userId: req.user._id, revisited: false } },
    {
      $group: {
        _id: { subject: '$subject', chapter: '$chapter' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data: grouped });
};

module.exports = { getMistakes, markRevised, getGrouped };
