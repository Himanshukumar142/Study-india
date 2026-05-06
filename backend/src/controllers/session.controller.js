const StudySession = require('../models/StudySession.model');
const FocusSession = require('../models/FocusSession.model');
const User = require('../models/User.model');
const { calculateXP, getLevelFromXP } = require('../utils/xpEngine');

// POST /api/sessions/study
const saveStudySession = async (req, res) => {
  const { contentId, durationMinutes, startPage, endPage, totalPages } = req.body;
  if (!contentId || !durationMinutes) {
    return res.status(422).json({ success: false, message: 'contentId and durationMinutes required' });
  }

  const xpGained = calculateXP('STUDY_SESSION', { minutes: durationMinutes });

  const session = await StudySession.create({
    userId: req.user._id,
    contentId,
    durationMinutes,
    startPage: startPage || 1,
    endPage: endPage || 1,
    totalPages: totalPages || 1,
    xpAwarded: xpGained,
  });

  const user = await User.findById(req.user._id);
  user.xp += xpGained;
  user.level = getLevelFromXP(user.xp);
  user.totalStudyMinutes += durationMinutes;
  await user.save();

  res.status(201).json({ success: true, data: session, xpGained });
};

// POST /api/sessions/focus
const saveFocusSession = async (req, res) => {
  const { timerDuration, actualDuration, tabSwitches, windowBlurs, violations, completed } = req.body;

  const totalViolations = (tabSwitches || 0) + (windowBlurs || 0) + (violations || 0);
  const focusScore = Math.max(0, 100 - totalViolations * 10);
  const xpGained = completed ? calculateXP('FOCUS_SESSION') : 0;

  const session = await FocusSession.create({
    userId: req.user._id,
    timerDuration,
    actualDuration,
    tabSwitches: tabSwitches || 0,
    windowBlurs: windowBlurs || 0,
    violations: totalViolations,
    focusScore,
    completed: completed || false,
    xpAwarded: xpGained,
  });

  if (xpGained > 0) {
    const user = await User.findById(req.user._id);
    user.xp += xpGained;
    user.level = getLevelFromXP(user.xp);
    await user.save();
  }

  res.status(201).json({ success: true, data: session, xpGained });
};

// GET /api/sessions/study
const getStudySessions = async (req, res) => {
  const { limit = 20 } = req.query;
  const sessions = await StudySession.find({ userId: req.user._id })
    .populate('contentId', 'title subject chapter')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
  res.json({ success: true, data: sessions });
};

// GET /api/sessions/focus
const getFocusSessions = async (req, res) => {
  const { limit = 20 } = req.query;
  const sessions = await FocusSession.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
  res.json({ success: true, data: sessions });
};

module.exports = { saveStudySession, saveFocusSession, getStudySessions, getFocusSessions };
