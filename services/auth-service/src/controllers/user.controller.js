const User = require('../models/User.model');
const { getLevelFromXP } = require('../utils/xpEngine');

// GET /api/users/profile
const getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  const { name, exam, class: cls, goals, avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (exam) user.exam = exam;
  if (cls) user.class = cls;
  if (goals !== undefined) user.goals = goals;
  if (avatar) user.avatar = avatar;

  await user.save();
  res.json({ success: true, message: 'Profile updated', data: user });
};

// PUT /api/users/password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(422).json({ success: false, message: 'Both passwords are required' });
  }
  if (newPassword.length < 6) {
    return res.status(422).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user._id);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
};

// GET /api/users/stats  — quick dashboard summary
const getStats = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    data: {
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      totalStudyMinutes: user.totalStudyMinutes,
      weakTopics: user.weakTopics,
    },
  });
};

module.exports = { getProfile, updateProfile, changePassword, getStats };
