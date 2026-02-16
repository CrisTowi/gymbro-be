const Routine = require('../models/Routine');

// GET /api/routines
exports.getAll = async (req, res, next) => {
  try {
    const routines = await Routine.find().sort({ routineId: 1 });
    res.json(routines);
  } catch (err) {
    next(err);
  }
};

// GET /api/routines/:id
exports.getById = async (req, res, next) => {
  try {
    const routine = await Routine.findOne({ routineId: req.params.id });
    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.json(routine);
  } catch (err) {
    next(err);
  }
};
