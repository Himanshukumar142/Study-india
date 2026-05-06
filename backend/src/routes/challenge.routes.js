const router = require('express').Router();
const { getChallenges, completeChallenge, createChallenge } = require('../controllers/challenge.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.use(verifyAccessToken);

router.get('/', getChallenges);
router.post('/:id/complete', completeChallenge);
router.post('/', requireAdmin, createChallenge);

module.exports = router;
