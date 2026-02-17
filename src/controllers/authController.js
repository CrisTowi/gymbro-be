const jwt = require('jsonwebtoken');
const Invitation = require('../models/Invitation');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function userToJSON(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    height: user.height,
    weight: user.weight,
    goal: user.goal,
  };
}

// GET /api/auth/invitation/:token — validate invitation for registration
exports.validateInvitation = async (req, res, next) => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token });
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (invitation.usedAt) {
      return res.status(400).json({ error: 'Invitation has already been used' });
    }
    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }
    res.json({ valid: true, invitationId: invitation._id.toString() });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register — register with valid invitation
exports.register = async (req, res, next) => {
  try {
    const { invitationToken, name, email, password, height, weight, goal } = req.body;

    if (!invitationToken || !name || !email || !password) {
      return res.status(400).json({
        error: 'invitationToken, name, email, and password are required',
      });
    }

    const invitation = await Invitation.findOne({ token: invitationToken });
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (invitation.usedAt) {
      return res.status(400).json({ error: 'Invitation has already been used' });
    }
    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name: name.trim(),
      height: height != null && height !== '' ? Number(height) : null,
      weight: weight != null && weight !== '' ? Number(weight) : null,
      goal: goal != null && goal !== '' ? String(goal).trim() : null,
    });

    invitation.usedAt = new Date();
    await invitation.save();

    const token = signToken(user._id);
    res.status(201).json({
      user: userToJSON(user),
      token,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({
      user: userToJSON(user),
      token,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me — current user (requires auth)
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(userToJSON(user));
  } catch (err) {
    next(err);
  }
};
