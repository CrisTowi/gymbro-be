const crypto = require('crypto');
const Exercise = require('../models/Exercise');
const Session = require('../models/Session');

/** Serialize session for API: include exerciseId from populated exercise so client keeps same shape. */
exports.sessionToJSON = function sessionToJSON(session) {
  const o = session.toObject ? session.toObject() : session;
  o.exercises = (o.exercises || []).map((e) => ({
    ...e,
    exerciseId:
      e.exercise?.exerciseId ??
      (e.exercise && typeof e.exercise === 'object' ? e.exercise.exerciseId : null) ??
      (e.exercise ? String(e.exercise) : null),
    exercise: undefined,
  }));
  o.personalRecords = (o.personalRecords || []).map((pr) => ({
    ...pr,
    exerciseId:
      pr.exercise?.exerciseId ??
      (pr.exercise && typeof pr.exercise === 'object' ? pr.exercise.exerciseId : null) ??
      (pr.exercise ? String(pr.exercise) : null),
    exercise: undefined,
  }));
  return o;
};

/** Resolve exercises array (client sends exerciseId) to exercise ObjectIds. */
async function resolveExercises(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  const resolved = [];
  for (const entry of items) {
    const idOrSlug = entry.exerciseId ?? entry.exercise;
    if (!idOrSlug) continue;
    const str = String(idOrSlug).trim();
    const isObjectId = str.length === 24 && /^[a-f0-9]{24}$/i.test(str);
    const exercise = isObjectId
      ? await Exercise.findById(str)
      : await Exercise.findOne({ exerciseId: str });
    if (!exercise) continue;
    const { exerciseId: _e, ...rest } = entry;
    resolved.push({ ...rest, exercise: exercise._id });
  }
  return resolved;
}

/** Resolve personalRecords array (client sends exerciseId) to exercise ObjectIds. */
async function resolvePersonalRecords(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  const resolved = [];
  for (const pr of items) {
    const idOrSlug = pr.exerciseId ?? pr.exercise;
    if (!idOrSlug) continue;
    const str = String(idOrSlug).trim();
    const isObjectId = str.length === 24 && /^[a-f0-9]{24}$/i.test(str);
    const exercise = isObjectId
      ? await Exercise.findById(str)
      : await Exercise.findOne({ exerciseId: str });
    if (!exercise) continue;
    const { exerciseId: _e, exercise: _ex, ...rest } = pr;
    resolved.push({ ...rest, exercise: exercise._id });
  }
  return resolved;
}

// GET /api/sessions
// Supports ?completed=true|false and ?routineId=
exports.getAll = async (req, res, next) => {
  try {
    const filter = { userId: req.user.userId, isActive: false };

    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === 'true';
    }
    if (req.query.routineId) {
      filter.routineId = req.query.routineId;
      filter.completed = true;
    }

    const sessions = await Session.find(filter)
      .sort({ date: -1 })
      .populate('exercises.exercise')
      .populate('personalRecords.exercise');
    res.json(sessions.map(exports.sessionToJSON));
  } catch (err) {
    next(err);
  }
};

// GET /api/sessions/active
exports.getActive = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      userId: req.user.userId,
      isActive: true,
    })
      .populate('exercises.exercise')
      .populate('personalRecords.exercise');
    res.json(session ? exports.sessionToJSON(session) : null);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sessions/active
exports.clearActive = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      userId: req.user.userId,
      isActive: true,
    });
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
    const session = await Session.findOne({
      sessionId: req.params.id,
      userId: req.user.userId,
    })
      .populate('exercises.exercise')
      .populate('personalRecords.exercise');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(exports.sessionToJSON(session));
  } catch (err) {
    next(err);
  }
};

// POST /api/sessions
exports.create = async (req, res, next) => {
  try {
    await Session.deleteMany({
      userId: req.user.userId,
      isActive: true,
    });

    const rawExercises = req.body.exercises || [];
    const exercises = await resolveExercises(rawExercises);

    const sessionData = {
      userId: req.user.userId,
      sessionId: req.body.sessionId || crypto.randomUUID(),
      date: req.body.date || new Date().toISOString(),
      routineId: req.body.routineId,
      startTime: req.body.startTime || new Date().toISOString(),
      exercises,
      completed: false,
      totalWeightLbs: 0,
      isActive: true,
    };

    const session = await Session.create(sessionData);
    await session.populate(['exercises.exercise', 'personalRecords.exercise']);
    res.status(201).json(exports.sessionToJSON(session));
  } catch (err) {
    next(err);
  }
};

// PUT /api/sessions/:id
exports.update = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      sessionId: req.params.id,
      userId: req.user.userId,
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (req.body.exercises !== undefined) {
      session.exercises = await resolveExercises(req.body.exercises);
    }
    if (req.body.personalRecords !== undefined) {
      session.personalRecords = await resolvePersonalRecords(req.body.personalRecords);
    }
    if (req.body.completed !== undefined) session.completed = req.body.completed;
    if (req.body.totalWeightLbs !== undefined) session.totalWeightLbs = req.body.totalWeightLbs;
    if (req.body.endTime !== undefined) session.endTime = req.body.endTime;
    if (req.body.duration !== undefined) session.duration = req.body.duration;

    if (req.body.completed === true) {
      session.isActive = false;
    }

    await session.save();
    await session.populate(['exercises.exercise', 'personalRecords.exercise']);
    res.json(exports.sessionToJSON(session));
  } catch (err) {
    next(err);
  }
};
