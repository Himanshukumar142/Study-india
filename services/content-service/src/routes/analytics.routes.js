const router = require('express').Router();
const { getDashboard, getStudyTime } = require('../controllers/analytics.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);

router.get('/dashboard', getDashboard);
router.get('/study-time', getStudyTime);

module.exports = router;
