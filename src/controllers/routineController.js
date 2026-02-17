const Routine = require('../models/Routine');
const defaultRoutines = require('../seed/routines');

// GET /api/routines — current user's routines
exports.getAll = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const routines = await Routine.find({ userId }).sort({ routineId: 1 });
    res.json(routines);
  } catch (err) {
    next(err);
  }
};

// GET /api/routines/:id — one routine by id (must belong to user)
exports.getById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const routine = await Routine.findOne({
      userId,
      routineId: req.params.id,
    });
    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.json(routine);
  } catch (err) {
    next(err);
  }
};

// POST /api/routines/seed-defaults — create push, pull, legs, full-body for user if they have none
exports.seedDefaults = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const existing = await Routine.find({ userId });
    if (existing.length > 0) {
      return res.status(400).json({
        error: 'You already have routines. Use create to add more.',
      });
    }
    const created = await Routine.insertMany(
      defaultRoutines.map((r) => ({
        userId,
        routineId: r.routineId,
        name: r.name,
        description: r.description || '',
        color: r.color,
        icon: r.icon,
        exercises: r.exercises || [],
      }))
    );
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

// POST /api/routines — create a new routine
exports.create = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { routineId, name, description, color, icon, exercises } = req.body;
    if (!routineId || !name || !color || !icon) {
      return res.status(400).json({
        error: 'routineId, name, color, and icon are required',
      });
    }
    const slug = String(routineId).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      return res.status(400).json({ error: 'routineId must be a non-empty slug' });
    }
    const existing = await Routine.findOne({ userId, routineId: slug });
    if (existing) {
      return res.status(409).json({ error: 'A routine with this id already exists' });
    }
    const routine = await Routine.create({
      userId,
      routineId: slug,
      name: String(name),
      description: description != null ? String(description) : '',
      color: String(color),
      icon: String(icon),
      exercises: Array.isArray(exercises) ? exercises : [],
    });
    res.status(201).json(routine);
  } catch (err) {
    next(err);
  }
};

// PUT /api/routines/:id — update routine (name, icon, color, description, exercises)
exports.update = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const routine = await Routine.findOne({
      userId,
      routineId: req.params.id,
    });
    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    const { name, description, color, icon, exercises } = req.body;
    if (name !== undefined) routine.name = String(name);
    if (description !== undefined) routine.description = String(description);
    if (color !== undefined) routine.color = String(color);
    if (icon !== undefined) routine.icon = String(icon);
    if (exercises !== undefined) {
      routine.exercises = Array.isArray(exercises) ? exercises : routine.exercises;
      routine.markModified('exercises');
    }
    await routine.save();
    res.json(routine);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/routines/:id
exports.remove = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const routine = await Routine.findOneAndDelete({
      userId,
      routineId: req.params.id,
    });
    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
