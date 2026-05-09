const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/ai.controller');
const { generateFromPDF } = require('../controllers/pdfQuiz.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/chat', verifyAccessToken, chatWithAI);
router.post('/generate-from-pdf', verifyAccessToken, upload.single('pdf'), generateFromPDF);

module.exports = router;
