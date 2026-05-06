const router = require('express').Router();
const { signup, login, refresh, logout, me } = require('../controllers/auth.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', verifyAccessToken, me);

module.exports = router;
