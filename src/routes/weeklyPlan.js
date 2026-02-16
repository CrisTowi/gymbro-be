const router = require('express').Router();
const ctrl = require('../controllers/weeklyPlanController');

router.get('/', ctrl.get);
router.put('/', ctrl.update);

module.exports = router;
