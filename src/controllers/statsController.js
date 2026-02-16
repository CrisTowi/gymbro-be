const Session = require('../models/Session');

// GET /api/stats/overview
exports.getOverview = async (req, res, next) => {
  try {
    const sessions = await Session.find({ completed: true, isActive: false });

    const totalSessions = sessions.length;
    const totalWeight = sessions.reduce((sum, s) => sum + s.totalWeightLbs, 0);

    const exerciseIdSet = new Set();
    for (const session of sessions) {
      for (const ex of session.exercises) {
        exerciseIdSet.add(ex.exerciseId);
      }
    }

    // Compute personal records count
    const records = buildPersonalRecords(sessions);

    res.json({
      totalSessions,
      totalWeight,
      totalExercises: exerciseIdSet.size,
      personalRecordCount: Object.keys(records).length,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/personal-records
exports.getPersonalRecords = async (req, res, next) => {
  try {
    const sessions = await Session.find({ completed: true, isActive: false });
    const records = buildPersonalRecords(sessions);
    res.json(records);
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/exercises/:exerciseId/history
exports.getExerciseHistory = async (req, res, next) => {
  try {
    const { exerciseId } = req.params;
    const sessions = await Session.find({ completed: true, isActive: false });

    const history = [];
    for (const session of sessions) {
      const exerciseLog = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exerciseLog) continue;

      const completedSets = exerciseLog.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      const maxWeight = Math.max(...completedSets.map((s) => s.weightLbs));
      const totalVolume = completedSets.reduce((sum, s) => sum + s.weightLbs * s.reps, 0);

      history.push({ date: session.date, maxWeight, totalVolume });
    }

    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json(history);
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/exercises/:exerciseId/last
exports.getLastExercisePerformance = async (req, res, next) => {
  try {
    const { exerciseId } = req.params;
    const sessions = await Session.find({ completed: true, isActive: false }).sort({ date: -1 });

    for (const session of sessions) {
      const exerciseLog = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exerciseLog) continue;

      const completedSets = exerciseLog.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      const bestSet = completedSets.reduce((best, set) =>
        set.weightLbs > best.weightLbs ? set : best
      );

      return res.json({
        weightLbs: bestSet.weightLbs,
        reps: bestSet.reps,
        date: session.date,
      });
    }

    res.json(null);
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/exercises/:exerciseId/recommended-sets?sets=4
exports.getRecommendedSets = async (req, res, next) => {
  try {
    const { exerciseId } = req.params;
    const targetSetCount = parseInt(req.query.sets, 10) || 4;

    const sessions = await Session.find({ completed: true, isActive: false }).sort({ date: -1 });

    for (const session of sessions) {
      const exerciseLog = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exerciseLog) continue;

      const completedSets = exerciseLog.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      const recommendations = [];
      for (let i = 0; i < targetSetCount; i++) {
        if (i < completedSets.length) {
          recommendations.push({
            weightLbs: completedSets[i].weightLbs,
            reps: completedSets[i].reps,
          });
        } else {
          const lastKnown = completedSets[completedSets.length - 1];
          recommendations.push({
            weightLbs: lastKnown.weightLbs,
            reps: lastKnown.reps,
          });
        }
      }

      return res.json(recommendations);
    }

    res.json([]);
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/last-session
exports.getLastSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({ completed: true, isActive: false }).sort({ date: -1 });
    res.json(session);
  } catch (err) {
    next(err);
  }
};

// Shared helper to compute personal records from a list of sessions
function buildPersonalRecords(sessions) {
  const records = {};

  for (const session of sessions) {
    for (const exerciseLog of session.exercises) {
      const completedSets = exerciseLog.sets.filter((s) => s.completed);
      if (completedSets.length === 0) continue;

      const maxWeight = Math.max(...completedSets.map((s) => s.weightLbs));
      const totalVolume = completedSets.reduce((sum, s) => sum + s.weightLbs * s.reps, 0);

      const current = records[exerciseLog.exerciseId];
      if (
        !current ||
        maxWeight > current.maxWeight ||
        totalVolume > current.maxVolume
      ) {
        records[exerciseLog.exerciseId] = {
          maxWeight: current ? Math.max(maxWeight, current.maxWeight) : maxWeight,
          maxVolume: current ? Math.max(totalVolume, current.maxVolume) : totalVolume,
          date: session.date,
        };
      }
    }
  }

  return records;
}
