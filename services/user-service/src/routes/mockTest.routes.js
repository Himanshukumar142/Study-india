const router = require('express').Router();
const {
  createMockTest,
  getMockTests,
  startMockTest,
  getMockTestLeaderboard
} = require('../controllers/mockTest.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.use(verifyAccessToken);

router.get('/', getMockTests);
router.post('/', requireAdmin, createMockTest);
router.post('/:id/start', startMockTest);
router.get('/:id/leaderboard', getMockTestLeaderboard);

module.exports = router;
