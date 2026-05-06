const router = require('express').Router();
const { getLeaderboard } = require('../controllers/leaderboard.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.get('/', verifyAccessToken, getLeaderboard);

module.exports = router;
