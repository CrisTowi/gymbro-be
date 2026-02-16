const WeeklyPlan = require('../models/WeeklyPlan');

const DEFAULT_PLAN = {
  monday: 'push',
  tuesday: 'pull',
  wednesday: null,
  thursday: 'legs',
  friday: null,
  saturday: 'full-body',
  sunday: null,
};

// GET /api/weekly-plan
exports.get = async (req, res, next) => {
  try {
    let plan = await WeeklyPlan.findOne();
    if (!plan) {
      plan = await WeeklyPlan.create(DEFAULT_PLAN);
    }
    res.json(plan);
  } catch (err) {
    next(err);
  }
};

// PUT /api/weekly-plan
exports.update = async (req, res, next) => {
  try {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const update = {};

    for (const day of days) {
      if (req.body[day] !== undefined) {
        update[day] = req.body[day];
      }
    }

    let plan = await WeeklyPlan.findOne();
    if (!plan) {
      plan = await WeeklyPlan.create({ ...DEFAULT_PLAN, ...update });
    } else {
      Object.assign(plan, update);
      await plan.save();
    }

    res.json(plan);
  } catch (err) {
    next(err);
  }
};
