const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/ai.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.post('/chat', verifyAccessToken, chatWithAI);

module.exports = router;
