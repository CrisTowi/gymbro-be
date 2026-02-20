const router = require('express').Router();
const ctrl = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.get('/invitation/:token', ctrl.validateInvitation);
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', requireAuth, ctrl.me);
router.patch('/me', requireAuth, ctrl.updateMe);

module.exports = router;
