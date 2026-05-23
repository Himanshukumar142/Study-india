const router = require('express').Router();
const { getPlan, getWeekPlans, savePlan, toggleTask, deleteTask } = require('../controllers/studyPlan.controller');
const { verifyAccessToken } = require('../middleware/auth.middleware');

router.use(verifyAccessToken);
router.get('/', getPlan);
router.get('/week', getWeekPlans);
router.post('/', savePlan);
router.patch('/task/:taskIndex', toggleTask);
router.delete('/task/:taskIndex', deleteTask);

module.exports = router;
