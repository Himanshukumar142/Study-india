const router = require('express').Router();
const { getStats, getUsers, toggleUser, getContent, deleteContent, getUserPerformance, getPlatformPerformance } = require('../controllers/admin.controller');
const { getMongoDBUsage, getB2Usage, getCombinedUsage } = require('../controllers/systemUsage.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// All routes in this file require a valid JWT + admin role
router.use(verifyAccessToken, requireAdmin);

// ── Existing admin routes ──────────────────────────────────
router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUser);
router.get('/users/:id/performance', getUserPerformance);
router.get('/analytics/performance', getPlatformPerformance);
router.get('/content', getContent);
router.delete('/content/:id', deleteContent);

// ── System Usage routes (real-time, no dummy data) ─────────
router.get('/system/mongodb-usage',  getMongoDBUsage);   // GET /api/admin/system/mongodb-usage
router.get('/system/b2-usage',       getB2Usage);        // GET /api/admin/system/b2-usage
router.get('/system/combined',       getCombinedUsage);  // GET /api/admin/system/combined  (fast overview)

module.exports = router;

