const router = require('express').Router();
const { addBookmark, removeBookmark, getBookmarks } = require('../controllers/bookmark.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);

router.get('/', getBookmarks);
router.post('/:type/:itemId', addBookmark);
router.delete('/:type/:itemId', removeBookmark);

module.exports = router;
