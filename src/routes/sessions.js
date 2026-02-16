const router = require('express').Router();
const ctrl = require('../controllers/sessionController');

// Active session routes must be defined before :id to avoid conflicts
router.get('/active', ctrl.getActive);
router.delete('/active', ctrl.clearActive);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);

module.exports = router;
