const router = require('express').Router();
const { saveStudySession, saveFocusSession, getStudySessions, getFocusSessions } = require('../controllers/session.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);

router.post('/study', saveStudySession);
router.post('/focus', saveFocusSession);
router.get('/study', getStudySessions);
router.get('/focus', getFocusSessions);

module.exports = router;
