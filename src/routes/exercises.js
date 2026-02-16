const router = require('express').Router();
const ctrl = require('../controllers/exerciseController');

router.get('/', ctrl.getAll);
router.get('/categories', ctrl.getCategories);
router.get('/:id', ctrl.getById);
router.get('/:id/alternatives', ctrl.getAlternatives);

module.exports = router;
