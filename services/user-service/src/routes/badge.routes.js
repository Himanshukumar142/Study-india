const router = require('express').Router();
const { getBadges, checkBadges, awardSpecialBadge } = require('../controllers/badge.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
router.use(verifyAccessToken);
router.get('/', getBadges);
router.post('/check', checkBadges);
router.post('/award', awardSpecialBadge);
module.exports = router;
