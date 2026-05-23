const router = require('express').Router();
const { uploadContent, listContent, getContent, deleteContent, updateStatus, streamFile, downloadFile } = require('../controllers/content.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

// Public list (auth optional for filtering own content)
router.get('/', verifyAccessToken, listContent);
router.get('/:id', verifyAccessToken, getContent);

// Stream file through backend (bypasses B2 CORS — for PDF/image preview)
router.get('/:id/stream', verifyAccessToken, streamFile);

// Download file through backend (same proxy, forces browser save-dialog)
router.get('/:id/download', verifyAccessToken, downloadFile);

// Protected
router.post('/upload', verifyAccessToken, upload.single('file'), uploadContent);
router.delete('/:id', verifyAccessToken, deleteContent);

// Admin only
router.patch('/:id/status', verifyAccessToken, requireAdmin, updateStatus);

module.exports = router;

