const mongoose = require('mongoose');
const Routine = require('../models/Routine');
const WeeklyPlan = require('../models/WeeklyPlan');

const DEFAULT_PLAN_ROUTINE_IDS = {
  monday: 'push',
  tuesday: 'pull',
  wednesday: null,
  thursday: 'legs',
  friday: null,
  saturday: 'full-body',
  sunday: null,
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function isObjectIdString(value) {
  if (value == null || typeof value !== 'string') return false;
  return value.length === 24 && /^[a-f0-9]{24}$/i.test(value);
}

/** Resolve default routineIds to Routine _ids for the given user. */
async function resolveDefaultPlan(userId) {
  const routines = await Routine.find({ userId }).lean();
  const byRoutineId = Object.fromEntries(routines.map((r) => [r.routineId, r._id]));
  const plan = { userId };
  for (const day of DAYS) {
    const rid = DEFAULT_PLAN_ROUTINE_IDS[day];
    plan[day] = rid ? byRoutineId[rid] || null : null;
  }
  return plan;
}

/** Normalize a day value from request (ObjectId string or routineId) to ObjectId or null. */
async function resolveDayValue(userId, value) {
  if (value === null || value === undefined || value === '') return null;
  if (isObjectIdString(value)) return new mongoose.Types.ObjectId(value);
  const routine = await Routine.findOne({ userId, routineId: String(value).trim() });
  return routine ? routine._id : null;
}

// GET /api/weekly-plan
exports.get = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let plan = await WeeklyPlan.findOne({ userId });
    if (!plan) {
      const defaultPlan = await resolveDefaultPlan(userId);
      plan = await WeeklyPlan.create(defaultPlan);
    }
    res.json(plan);
  } catch (err) {
    next(err);
  }
};

// PUT /api/weekly-plan
exports.update = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const update = {};

    for (const day of DAYS) {
      if (req.body[day] !== undefined) {
        update[day] = await resolveDayValue(userId, req.body[day]);
      }
    }

    let plan = await WeeklyPlan.findOne({ userId });
    if (!plan) {
      const defaultPlan = await resolveDefaultPlan(userId);
      plan = await WeeklyPlan.create({ ...defaultPlan, ...update });
    } else {
      Object.assign(plan, update);
      await plan.save();
    }

    res.json(plan);
  } catch (err) {
    next(err);
  }
};
