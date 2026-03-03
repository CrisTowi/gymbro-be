/**
 * Demo seed script — populates a realistic demo user for LinkedIn recording.
 *
 * Usage:
 *   npm run seed-demo
 *
 * Safe to re-run: clears all existing data for the demo email before seeding.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const User = require('../src/models/User');
const Exercise = require('../src/models/Exercise');
const Routine = require('../src/models/Routine');
const Session = require('../src/models/Session');
const WeeklyPlan = require('../src/models/WeeklyPlan');
const exerciseSeedData = require('../src/seed/exercises');

const DEMO_EMAIL = 'christian.consuelo2+gymtrack@gmail.com';
const DEMO_PASSWORD = 'password1'; // 8+ chars required by schema
const DEMO_NAME = 'Christian';

// ─── helpers ──────────────────────────────────────────────────────────────────

function randomId() {
  return crypto.randomBytes(16).toString('hex');
}

/** ISO timestamp N days in the past, at a given hour */
function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Build an array of completed set logs */
function makeSets(weights, reps) {
  return weights.map((w, i) => ({
    setNumber: i + 1,
    reps: Array.isArray(reps) ? reps[i] : reps,
    weightLbs: w,
    completed: true,
    timestamp: new Date().toISOString(),
  }));
}

/** Sum weight × reps for all completed sets across all exercises in a session */
function calcTotalWeight(exerciseLogs) {
  return exerciseLogs.reduce((total, ex) => {
    return (
      total +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.weightLbs * s.reps, 0)
    );
  }, 0);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Ensure global exercise catalog is present
  const exerciseCount = await Exercise.countDocuments();
  if (exerciseCount === 0) {
    await Exercise.insertMany(exerciseSeedData);
    console.log(`✓ Seeded ${exerciseSeedData.length} exercises`);
  } else {
    console.log(`✓ Exercise catalog OK (${exerciseCount} docs)`);
  }

  // 2. Verify all required exercise IDs exist BEFORE touching user data
  const EXERCISE_IDS = [
    'bench-press', 'incline-dumbbell-press', 'overhead-press',
    'lateral-raises', 'tricep-pushdowns',
    'deadlift', 'pull-ups', 'barbell-rows', 'lat-pulldowns', 'bicep-curls',
    'squats', 'leg-press', 'romanian-deadlift', 'leg-curls', 'calf-raises',
    'plank', 'cable-crunches', 'hip-thrusts',
  ];

  const exerciseDocs = await Exercise.find({ exerciseId: { $in: EXERCISE_IDS } });
  const exMap = {};
  for (const ex of exerciseDocs) exMap[ex.exerciseId] = ex._id;

  const missing = EXERCISE_IDS.filter((id) => !exMap[id]);
  if (missing.length > 0) {
    console.error('✗ Missing exercises in DB:', missing);
    console.error('  Run: npm run seed');
    process.exit(1);
  }
  console.log(`✓ All ${EXERCISE_IDS.length} required exercises found`);

  // 3. Wipe existing demo user data
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    const [sessions, routines, plans] = await Promise.all([
      Session.deleteMany({ userId: existing._id }),
      Routine.deleteMany({ userId: existing._id }),
      WeeklyPlan.deleteMany({ userId: existing._id }),
    ]);
    await User.deleteOne({ _id: existing._id });
    console.log(`✓ Cleared previous demo data (${sessions.deletedCount} sessions, ${routines.deletedCount} routines, ${plans.deletedCount} plans)`);
  }

  // 4. Create demo user (password auto-hashed by pre-save hook)
  const user = await User.create({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    name: DEMO_NAME,
    height: 175,
    weight: 175,
    goal: 'Build muscle and strength',
    language: 'en',
  });
  console.log(`✓ Created user: ${user.email} (id: ${user._id})`);

  // 5. Create routines
  const routineDefs = [
    {
      routineId: 'push-routine-demo',
      name: 'Push Day',
      description: 'Chest, shoulders & triceps',
      color: '#ef4444',
      icon: '💪',
      exercises: [
        { exerciseId: 'bench-press', sets: 4, reps: 8, restTimeSeconds: 90 },
        { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 10, restTimeSeconds: 90 },
        { exerciseId: 'overhead-press', sets: 4, reps: 8, restTimeSeconds: 90 },
        { exerciseId: 'lateral-raises', sets: 3, reps: 15, restTimeSeconds: 60 },
        { exerciseId: 'tricep-pushdowns', sets: 3, reps: 12, restTimeSeconds: 60 },
      ],
    },
    {
      routineId: 'pull-routine-demo',
      name: 'Pull Day',
      description: 'Back & biceps',
      color: '#3b82f6',
      icon: '🏋️',
      exercises: [
        { exerciseId: 'deadlift', sets: 4, reps: 5, restTimeSeconds: 120 },
        { exerciseId: 'pull-ups', sets: 4, reps: 8, restTimeSeconds: 90 },
        { exerciseId: 'barbell-rows', sets: 4, reps: 8, restTimeSeconds: 90 },
        { exerciseId: 'lat-pulldowns', sets: 3, reps: 10, restTimeSeconds: 90 },
        { exerciseId: 'bicep-curls', sets: 3, reps: 12, restTimeSeconds: 60 },
      ],
    },
    {
      routineId: 'legs-routine-demo',
      name: 'Legs Day',
      description: 'Quads, hamstrings & calves',
      color: '#22c55e',
      icon: '🦵',
      exercises: [
        { exerciseId: 'squats', sets: 4, reps: 8, restTimeSeconds: 120 },
        { exerciseId: 'leg-press', sets: 4, reps: 10, restTimeSeconds: 90 },
        { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, restTimeSeconds: 90 },
        { exerciseId: 'leg-curls', sets: 3, reps: 12, restTimeSeconds: 60 },
        { exerciseId: 'calf-raises', sets: 4, reps: 15, restTimeSeconds: 60 },
      ],
    },
    {
      routineId: 'core-routine-demo',
      name: 'Core & Glutes',
      description: 'Core stability and glute activation',
      color: '#f59e0b',
      icon: '🔥',
      exercises: [
        { exerciseId: 'plank', sets: 3, reps: 1, restTimeSeconds: 60 },
        { exerciseId: 'cable-crunches', sets: 3, reps: 15, restTimeSeconds: 60 },
        { exerciseId: 'hip-thrusts', sets: 4, reps: 12, restTimeSeconds: 90 },
      ],
    },
  ];

  const routineMap = {};
  for (const def of routineDefs) {
    const r = await Routine.create({ userId: user._id, ...def });
    routineMap[r.routineId] = r;
    console.log(`  ✓ Routine: "${r.name}" (routineId: ${r.routineId}, _id: ${r._id})`);
  }
  console.log(`✓ Created ${routineDefs.length} routines`);

  // 6. Helper to build one exercise log for a session
  function exLog(exerciseId, weights, reps) {
    const exerciseObjectId = exMap[exerciseId];
    if (!exerciseObjectId) throw new Error(`Exercise not found in exMap: ${exerciseId}`);
    return { exercise: exerciseObjectId, sets: makeSets(weights, reps) };
  }

  // 7. Session data — 12 sessions over ~6 weeks with progressive overload
  //    Schedule: Push / Pull / Legs repeating, each ~7 days apart
  const sessionsData = [
    // ── Week 1 ────────────────────────────────────────────────────────────────
    {
      routineId: 'push-routine-demo',
      daysAgo: 42, duration: 3600,
      exercises: [
        exLog('bench-press',           [185, 185, 195, 195], 8),
        exLog('incline-dumbbell-press', [65, 65, 70],        10),
        exLog('overhead-press',        [115, 115, 125, 125], 8),
        exLog('lateral-raises',        [25, 25, 30],         15),
        exLog('tricep-pushdowns',      [50, 50, 55],         12),
      ],
    },
    {
      routineId: 'pull-routine-demo',
      daysAgo: 40, duration: 3300,
      exercises: [
        exLog('deadlift',     [275, 275, 295, 295], 5),
        exLog('pull-ups',     [0, 0, 0, 0],         8),
        exLog('barbell-rows', [155, 155, 165, 165], 8),
        exLog('lat-pulldowns',[120, 120, 130],       10),
        exLog('bicep-curls',  [40, 40, 45],          12),
      ],
    },
    {
      routineId: 'legs-routine-demo',
      daysAgo: 38, duration: 3900,
      exercises: [
        exLog('squats',            [225, 225, 245, 245], 8),
        exLog('leg-press',         [360, 360, 380, 380], 10),
        exLog('romanian-deadlift', [165, 165, 175],       10),
        exLog('leg-curls',         [100, 100, 110],       12),
        exLog('calf-raises',       [135, 135, 145, 145], 15),
      ],
    },
    // ── Week 2 ────────────────────────────────────────────────────────────────
    {
      routineId: 'push-routine-demo',
      daysAgo: 35, duration: 3720,
      exercises: [
        exLog('bench-press',           [195, 195, 205, 205], 8),
        exLog('incline-dumbbell-press', [70, 70, 75],        10),
        exLog('overhead-press',        [125, 125, 130, 130], 8),
        exLog('lateral-raises',        [27.5, 27.5, 30],     15),
        exLog('tricep-pushdowns',      [55, 55, 60],         12),
      ],
    },
    {
      routineId: 'pull-routine-demo',
      daysAgo: 33, duration: 3300,
      exercises: [
        exLog('deadlift',     [295, 295, 315, 315], 5),
        exLog('pull-ups',     [0, 0, 0, 0],         8),
        exLog('barbell-rows', [165, 165, 175, 175], 8),
        exLog('lat-pulldowns',[130, 130, 140],       10),
        exLog('bicep-curls',  [45, 45, 47.5],        12),
      ],
    },
    {
      routineId: 'legs-routine-demo',
      daysAgo: 31, duration: 3900,
      exercises: [
        exLog('squats',            [235, 235, 255, 255], 8),
        exLog('leg-press',         [380, 380, 400, 400], 10),
        exLog('romanian-deadlift', [175, 175, 185],       10),
        exLog('leg-curls',         [110, 110, 120],       12),
        exLog('calf-raises',       [145, 145, 155, 155], 15),
      ],
    },
    // ── Week 3 ────────────────────────────────────────────────────────────────
    {
      routineId: 'push-routine-demo',
      daysAgo: 28, duration: 3600,
      exercises: [
        exLog('bench-press',           [205, 205, 215, 215], 8),
        exLog('incline-dumbbell-press', [75, 75, 80],        10),
        exLog('overhead-press',        [130, 130, 135, 135], 8),
        exLog('lateral-raises',        [30, 30, 32.5],       15),
        exLog('tricep-pushdowns',      [60, 60, 65],         12),
      ],
    },
    {
      routineId: 'pull-routine-demo',
      daysAgo: 26, duration: 3480,
      exercises: [
        exLog('deadlift',     [315, 315, 335, 335], 5),
        exLog('pull-ups',     [0, 0, 0, 0],         8),
        exLog('barbell-rows', [175, 175, 185, 185], 8),
        exLog('lat-pulldowns',[140, 140, 150],       10),
        exLog('bicep-curls',  [47.5, 47.5, 50],     12),
      ],
    },
    {
      routineId: 'legs-routine-demo',
      daysAgo: 24, duration: 4200,
      exercises: [
        exLog('squats',            [245, 245, 265, 265], 8),
        exLog('leg-press',         [400, 400, 420, 420], 10),
        exLog('romanian-deadlift', [185, 185, 195],       10),
        exLog('leg-curls',         [120, 120, 130],       12),
        exLog('calf-raises',       [155, 155, 165, 165], 15),
      ],
    },
    // ── Week 4 ────────────────────────────────────────────────────────────────
    {
      routineId: 'push-routine-demo',
      daysAgo: 21, duration: 3600,
      exercises: [
        exLog('bench-press',           [215, 215, 225, 225], 8),
        exLog('incline-dumbbell-press', [80, 80, 85],        10),
        exLog('overhead-press',        [135, 135, 140, 140], 8),
        exLog('lateral-raises',        [30, 30, 35],         15),
        exLog('tricep-pushdowns',      [65, 65, 70],         12),
      ],
    },
    {
      routineId: 'pull-routine-demo',
      daysAgo: 19, duration: 3300,
      exercises: [
        exLog('deadlift',     [335, 335, 355, 355], 5),
        exLog('pull-ups',     [0, 0, 0, 0],         8),
        exLog('barbell-rows', [185, 185, 195, 195], 8),
        exLog('lat-pulldowns',[150, 150, 160],       10),
        exLog('bicep-curls',  [50, 50, 52.5],        12),
      ],
    },
    {
      routineId: 'legs-routine-demo',
      daysAgo: 17, duration: 3900,
      exercises: [
        exLog('squats',            [255, 255, 275, 275], 8),
        exLog('leg-press',         [420, 420, 440, 440], 10),
        exLog('romanian-deadlift', [195, 195, 205],       10),
        exLog('leg-curls',         [130, 130, 140],       12),
        exLog('calf-raises',       [165, 165, 175, 175], 15),
      ],
    },
  ];

  for (const sd of sessionsData) {
    const startTime = daysAgo(sd.daysAgo, 10);
    const endTime = new Date(
      new Date(startTime).getTime() + sd.duration * 1000
    ).toISOString();
    await Session.create({
      userId: user._id,
      sessionId: randomId(),
      date: startTime,
      routineId: sd.routineId,
      startTime,
      endTime,
      exercises: sd.exercises,
      completed: true,
      isActive: false,
      totalWeightLbs: calcTotalWeight(sd.exercises),
      duration: sd.duration,
      personalRecords: [],
    });
  }
  console.log(`✓ Created ${sessionsData.length} sessions`);

  // 8. Weekly plan
  await WeeklyPlan.create({
    userId: user._id,
    monday:    routineMap['push-routine-demo']._id,
    tuesday:   routineMap['pull-routine-demo']._id,
    wednesday: routineMap['legs-routine-demo']._id,
    thursday:  routineMap['core-routine-demo']._id,
    friday:    routineMap['push-routine-demo']._id,
    saturday:  routineMap['pull-routine-demo']._id,
    sunday:    null,
  });
  console.log('✓ Created weekly plan');

  // 9. Verify — query back what was actually saved
  const [savedRoutines, savedSessions, savedPlan] = await Promise.all([
    Routine.countDocuments({ userId: user._id }),
    Session.countDocuments({ userId: user._id, completed: true }),
    WeeklyPlan.findOne({ userId: user._id }),
  ]);

  console.log('\n─── Verification ───────────────────────────────────────');
  console.log(`  Routines in DB for user: ${savedRoutines}`);
  console.log(`  Completed sessions in DB: ${savedSessions}`);
  console.log(`  Weekly plan exists: ${savedPlan ? 'yes' : 'NO — something went wrong'}`);

  if (savedRoutines !== routineDefs.length || savedSessions !== sessionsData.length || !savedPlan) {
    console.error('\n✗ Verification failed — some data was not saved correctly');
    process.exit(1);
  }

  console.log('\n✅  Demo seed complete!');
  console.log(`    Email:    ${DEMO_EMAIL}`);
  console.log(`    Password: ${DEMO_PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n✗ Demo seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
