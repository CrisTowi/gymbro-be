const mongoose = require('mongoose');
const Routine = require('../models/Routine');
const WeeklyPlan = require('../models/WeeklyPlan');
const { generateWeeklyPlanFromDescription } = require('../lib/llm');

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

/** Map routine name (from LLM) to routine _id for the user.
 *  Falls back through exact → starts-with → contains matching. */
async function resolveRoutineNameToId(userId, routineName, routines) {
  if (!routineName || String(routineName).toLowerCase() === 'rest') return null;
  const name = String(routineName).trim().toLowerCase();

  // 1. Exact match (case-insensitive)
  const exact = routines.find((r) => r.name && r.name.trim().toLowerCase() === name);
  if (exact) return exact._id.toString();

  // 2. One name starts with the other ("leg" → "Legs", "Push Workout" → "Push")
  const partial = routines.find((r) => {
    if (!r.name) return false;
    const rn = r.name.trim().toLowerCase();
    return rn.startsWith(name) || name.startsWith(rn);
  });
  if (partial) return partial._id.toString();

  // 3. One name contains the other ("Leg Day" → "Legs", "Push" → "Push Workout")
  const contains = routines.find((r) => {
    if (!r.name) return false;
    const rn = r.name.trim().toLowerCase();
    return rn.includes(name) || name.includes(rn);
  });
  if (contains) return contains._id.toString();

  return null;
}

// POST /api/weekly-plan/generate
exports.generate = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { description } = req.body || {};

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'description is required' });
    }

    const routines = await Routine.find({ userId }).select('_id name description').lean();

    const planByNames = await generateWeeklyPlanFromDescription({
      description: description.trim(),
      routines: routines.map((r) => ({ name: r.name, description: r.description })),
      provider: process.env.LLM_PROVIDER,
    });

    const plan = {};
    for (const day of DAYS) {
      const nameOrRest = planByNames[day];
      plan[day] = await resolveRoutineNameToId(userId, nameOrRest, routines);
    }

    res.json(plan);
  } catch (err) {
    next(err);
  }
};
