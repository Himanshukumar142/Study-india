const router = require('express').Router();
const { getSyllabus, updateChapter, getStats } = require('../controllers/syllabus.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
router.use(verifyAccessToken);
router.get('/', getSyllabus);
router.get('/stats', getStats);
router.patch('/', updateChapter);
module.exports = router;
