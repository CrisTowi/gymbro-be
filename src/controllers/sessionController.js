const crypto = require('crypto');
const Session = require('../models/Session');

// GET /api/sessions
// Supports ?completed=true|false and ?routineId=
exports.getAll = async (req, res, next) => {
  try {
    const filter = { isActive: false };

    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === 'true';
    }
    if (req.query.routineId) {
      filter.routineId = req.query.routineId;
      filter.completed = true;
    }

    const sessions = await Session.find(filter).sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

// GET /api/sessions/active
exports.getActive = async (req, res, next) => {
  try {
    const session = await Session.findOne({ isActive: true });
    res.json(session);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sessions/active
exports.clearActive = async (req, res, next) => {
  try {
    const session = await Session.findOne({ isActive: true });
    if (!session) {
      return res.status(404).json({ error: 'No active session found' });
    }
    await Session.deleteOne({ _id: session._id });
    res.json({ message: 'Active session cleared' });
  } catch (err) {
    next(err);
  }
};

// GET /api/sessions/:id
exports.getById = async (req, res, next) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
};

// POST /api/sessions
exports.create = async (req, res, next) => {
  try {
    // Clear any existing active session
    await Session.deleteMany({ isActive: true });

    const sessionData = {
      sessionId: req.body.sessionId || crypto.randomUUID(),
      date: req.body.date || new Date().toISOString(),
      routineId: req.body.routineId,
      startTime: req.body.startTime || new Date().toISOString(),
      exercises: req.body.exercises || [],
      completed: false,
      totalWeightLbs: 0,
      isActive: true,
    };

    const session = await Session.create(sessionData);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

// PUT /api/sessions/:id
exports.update = async (req, res, next) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const allowedFields = [
      'exercises', 'completed', 'totalWeightLbs',
      'endTime', 'duration', 'personalRecords',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        session[field] = req.body[field];
      }
    }

    // When marking as completed, deactivate the session
    if (req.body.completed === true) {
      session.isActive = false;
    }

    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
};
