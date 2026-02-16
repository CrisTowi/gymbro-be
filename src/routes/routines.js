const router = require('express').Router();
const ctrl = require('../controllers/routineController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

module.exports = router;
