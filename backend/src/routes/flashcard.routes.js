const router = require('express').Router();
const { getFlashcards, getStats, createFlashcard, createBulk, reviewFlashcard, updateFlashcard, deleteFlashcard } = require('../controllers/flashcard.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);
router.get('/', getFlashcards);
router.get('/stats', getStats);
router.post('/', createFlashcard);
router.post('/bulk', createBulk);
router.post('/:id/review', reviewFlashcard);
router.put('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);

module.exports = router;
