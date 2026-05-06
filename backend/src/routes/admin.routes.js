const router = require('express').Router();
const { getStats, getUsers, toggleUser, getContent, deleteContent, getUserPerformance, getPlatformPerformance } = require('../controllers/admin.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.use(verifyAccessToken, requireAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUser);
router.get('/users/:id/performance', getUserPerformance);
router.get('/analytics/performance', getPlatformPerformance);
router.get('/content', getContent);
router.delete('/content/:id', deleteContent);

module.exports = router;
