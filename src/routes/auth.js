const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

router.get('/invitation/:token', ctrl.validateInvitation);
router.post('/register', authLimiter, ctrl.register);
router.post('/login', authLimiter, ctrl.login);
router.get('/me', requireAuth, ctrl.me);
router.patch('/me', requireAuth, ctrl.updateMe);

module.exports = router;
