const router = require('express').Router();
const { getDoubts, getDoubt, createDoubt, addAnswer, getAIAnswer, toggleUpvote, toggleAnswerUpvote } = require('../controllers/doubt.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);
router.get('/', getDoubts);
router.get('/:id', getDoubt);
router.post('/', createDoubt);
router.post('/:id/answer', addAnswer);
router.post('/:id/ai-answer', getAIAnswer);
router.post('/:id/upvote', toggleUpvote);
router.post('/:id/answers/:answerId/upvote', toggleAnswerUpvote);

module.exports = router;
