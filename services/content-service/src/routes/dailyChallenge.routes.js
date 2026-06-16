const router = require('express').Router();
const {
  getTodayChallenge,
  submitDailyChallenge,
  getChallengeHistory,
  adminListChallenges,
  adminCreateChallenge,
  adminDeleteChallenge,
  adminChallengeLeaderboard,
} = require('../controllers/dailyChallenge.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.use(verifyAccessToken);

// ── User routes ──
router.get('/', getTodayChallenge);
router.post('/submit', submitDailyChallenge);
router.get('/history', getChallengeHistory);

// ── Admin routes ──
router.get('/admin/list', requireAdmin, adminListChallenges);
router.post('/admin/create', requireAdmin, adminCreateChallenge);
router.delete('/admin/:date', requireAdmin, adminDeleteChallenge);
router.get('/admin/:date/leaderboard', requireAdmin, adminChallengeLeaderboard);

module.exports = router;
