const router = require('express').Router();
const {
  getQuestions, // keeping for backward compatibility if needed, or admin usage
  startQuiz,
  saveAnswer,
  submitQuiz,
  autoSubmitQuiz,
  getQuizResult,
  getAttempts,
  createQuestion,
  createQuestionsBulk,
  updateQuestion,
  deleteQuestion,
  reportViolation,
} = require('../controllers/quiz.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const { quizLimiter } = require('../middleware/rateLimiter.middleware');

router.use(verifyAccessToken);

// Secure Quiz Flow
router.post('/start', quizLimiter, startQuiz);
router.post('/answer', quizLimiter, saveAnswer);
router.post('/submit', quizLimiter, submitQuiz);
router.post('/auto-submit', quizLimiter, autoSubmitQuiz);
router.get('/result/:id', getQuizResult);
router.post('/violation', reportViolation);

// History & Admin
router.get('/attempts', getAttempts);
router.get('/questions', getQuestions); // Keep for backwards compatibility/admin
router.post('/questions', requireAdmin, createQuestion);
router.post('/questions/bulk', createQuestionsBulk);
router.patch('/questions/:id', requireAdmin, updateQuestion);
router.delete('/questions/:id', requireAdmin, deleteQuestion);

module.exports = router;

