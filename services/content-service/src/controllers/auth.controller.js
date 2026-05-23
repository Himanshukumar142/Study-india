const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User.model');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require('../utils/generateTokens');
const { getLevelFromXP } = require('../utils/xpEngine');

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  exam: Joi.string().valid('JEE', 'NEET', 'BOTH').default('JEE'),
  class: Joi.string().valid('11', '12', 'Dropper').default('11'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST /api/auth/signup
const signup = async (req, res) => {
  const { error } = signupSchema.validate(req.body);
  if (error) return res.status(422).json({ success: false, message: error.details[0].message });

  const { name, email, password, exam, class: cls } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

  const user = await User.create({ name, email, password, exam, class: cls });

  const payload = { id: user._id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        exam: user.exam,
        class: user.class,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
      },
    },
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(422).json({ success: false, message: error.details[0].message });

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

  if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated' });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

  // Update streak
  user.updateStreak();

  const payload = { id: user._id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        exam: user.exam,
        class: user.class,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        avatar: user.avatar,
      },
    },
  });
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== token) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ success: false, message: 'Refresh token reuse detected' });
  }

  // Rotate refresh token
  const payload = { id: user._id, role: user.role };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  user.refreshToken = newRefreshToken;
  await user.save();
  setRefreshTokenCookie(res, newRefreshToken);

  res.json({ success: true, data: { accessToken: newAccessToken } });
};

// POST /api/auth/logout
const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }
  clearRefreshTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/me
const me = async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      exam: user.exam,
      class: user.class,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      avatar: user.avatar,
      goals: user.goals,
      totalStudyMinutes: user.totalStudyMinutes,
      weakTopics: user.weakTopics,
    },
  });
};

module.exports = { signup, login, refresh, logout, me };
