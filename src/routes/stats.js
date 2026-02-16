const router = require('express').Router();
const ctrl = require('../controllers/statsController');

router.get('/overview', ctrl.getOverview);
router.get('/personal-records', ctrl.getPersonalRecords);
router.get('/last-session', ctrl.getLastSession);
router.get('/exercises/:exerciseId/history', ctrl.getExerciseHistory);
router.get('/exercises/:exerciseId/last', ctrl.getLastExercisePerformance);
router.get('/exercises/:exerciseId/recommended-sets', ctrl.getRecommendedSets);

module.exports = router;
