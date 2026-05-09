const router = require('express').Router();
const { analyzeUrl, proxyDownload, saveResource, getResources, deleteResource, getPublicResources } = require('../controllers/resource.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);
router.post('/analyze', analyzeUrl);
router.get('/download', proxyDownload);
router.get('/public', getPublicResources);
router.get('/', getResources);
router.post('/', saveResource);
router.delete('/:id', deleteResource);

module.exports = router;
