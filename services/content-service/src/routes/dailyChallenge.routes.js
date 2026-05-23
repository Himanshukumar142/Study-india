const router = require('express').Router();
const { getTodayChallenge, submitDailyChallenge, getChallengeHistory } = require('../controllers/dailyChallenge.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);
router.get('/', getTodayChallenge);
router.post('/submit', submitDailyChallenge);
router.get('/history', getChallengeHistory);

module.exports = router;
