const router = require('express').Router();
const ctrl = require('../controllers/weeklyPlanController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);
router.get('/', ctrl.get);
router.put('/', ctrl.update);
router.post('/generate', ctrl.generate);

module.exports = router;
