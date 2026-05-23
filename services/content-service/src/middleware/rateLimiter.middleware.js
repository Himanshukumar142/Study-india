const rateLimit = require('express-rate-limit');

// ── Global API limiter ────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again after 15 minutes.' },
});

// ── Auth limiter (brute-force protection) ─────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again after 15 minutes.' },
});

// ── AI limiter (expensive calls) ──────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI generation limit reached. Try again in an hour.' },
});

// ── Quiz submission limiter ───────────────────────────────────
const quizLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many quiz actions. Slow down.' },
});

module.exports = { globalLimiter, authLimiter, aiLimiter, quizLimiter };
