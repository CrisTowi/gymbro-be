const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { userId: payload.userId };
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
