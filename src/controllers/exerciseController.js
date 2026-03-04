const Exercise = require('../models/Exercise');

// GET /api/exercises
// Supports ?category= and ?tag= query filters
exports.getAll = async (req, res, next) => {
  try {
    const { category, tag } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    const exercises = await Exercise.find(filter).sort({ category: 1, name: 1 });
    res.json(exercises);
  } catch (err) {
    next(err);
  }
};

// GET /api/exercises/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Exercise.distinct('category');
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

// GET /api/exercises/:id
exports.getById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findOne({ exerciseId: req.params.id });
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (err) {
    next(err);
  }
};

// GET /api/exercises/:id/alternatives
// Returns exercises in the same category, ranked by shared tags
exports.getAlternatives = async (req, res, next) => {
  try {
    const exercise = await Exercise.findOne({ exerciseId: req.params.id });
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const excludeRaw = req.query.exclude || '';
    const excludeIds = excludeRaw ? excludeRaw.split(',').concat(req.params.id) : [req.params.id];

    const alternatives = await Exercise.find({
      category: exercise.category,
      exerciseId: { $nin: excludeIds },
    });

    // Rank by number of shared tags
    const ranked = alternatives
      .map((alt) => {
        const shared = alt.tags.filter((t) => exercise.tags.includes(t)).length;
        return { exercise: alt, shared };
      })
      .sort((a, b) => b.shared - a.shared)
      .map((item) => item.exercise);

    res.json(ranked);
  } catch (err) {
    next(err);
  }
};
