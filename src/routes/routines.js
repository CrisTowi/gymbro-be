const router = require('express').Router();
const ctrl = require('../controllers/routineController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);
router.get('/', ctrl.getAll);
router.post('/seed-defaults', ctrl.seedDefaults);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
