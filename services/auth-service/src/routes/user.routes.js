const router = require('express').Router();
const { getProfile, updateProfile, changePassword, getStats } = require('../controllers/user.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.get('/stats', getStats);

module.exports = router;
