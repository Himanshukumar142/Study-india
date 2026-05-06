const router = require('express').Router();
const {
  getQuestions, // keeping for backward compatibility if needed, or admin usage
  startQuiz,
  saveAnswer,
  submitQuiz,
  getQuizResult,
  getAttempts,
  createQuestion,
  createQuestionsBulk,
  reportViolation,
} = require('../controllers/quiz.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.use(verifyAccessToken);

// Secure Quiz Flow
router.post('/start', startQuiz);
router.post('/answer', saveAnswer);
router.post('/submit', submitQuiz);
router.get('/result/:id', getQuizResult);
router.post('/violation', reportViolation);

// History & Admin
router.get('/attempts', getAttempts);
router.get('/questions', getQuestions); // Keep for backwards compatibility/admin
router.post('/questions', requireAdmin, createQuestion);
router.post('/questions/bulk', requireAdmin, createQuestionsBulk);

module.exports = router;

