const router = require('express').Router();
const { getMistakes, markRevised, getGrouped } = require('../controllers/mistake.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);

router.get('/', getMistakes);
router.get('/grouped', getGrouped);
router.patch('/:id/revise', markRevised);

module.exports = router;
