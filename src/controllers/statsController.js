const Session = require('../models/Session');

function getExerciseIdFromLog(log) {
  return (
    log.exercise?.exerciseId ??
    (log.exercise && typeof log.exercise === 'object' ? log.exercise.exerciseId : null) ??
    (log.exercise ? String(log.exercise) : null) ??
    log.exerciseId
  );
}

// GET /api/stats/overview
exports.getOverview = async (req, res, next) => {
  try {
    const sessions = await Session.find({
      userId: req.user.userId,
      completed: true,
      isActive: false,
    }).populate('exercises.exercise');

    const totalSessions = sessions.length;
    const totalWeight = sessions.reduce((sum, s) => sum + s.totalWeightLbs, 0);

    const exerciseIdSet = new Set();
    for (const session of sessions) {
      for (const ex of session.exercises) {
        const id = getExerciseIdFromLog(ex);
        if (id) exerciseIdSet.add(id);
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
    const sessions = await Session.find({
      userId: req.user.userId,
      completed: true,
      isActive: false,
    }).populate('exercises.exercise');
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
    const sessions = await Session.find({
      userId: req.user.userId,
      completed: true,
      isActive: false,
    }).populate('exercises.exercise');

    const history = [];
    for (const session of sessions) {
      const exerciseLog = session.exercises.find((e) => getExerciseIdFromLog(e) === exerciseId);
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
    const sessions = await Session.find({
      userId: req.user.userId,
      completed: true,
      isActive: false,
    })
      .sort({ date: -1 })
      .populate('exercises.exercise');

    for (const session of sessions) {
      const exerciseLog = session.exercises.find((e) => getExerciseIdFromLog(e) === exerciseId);
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

    const sessions = await Session.find({
      userId: req.user.userId,
      completed: true,
      isActive: false,
    })
      .sort({ date: -1 })
      .populate('exercises.exercise');

    for (const session of sessions) {
      const exerciseLog = session.exercises.find((e) => getExerciseIdFromLog(e) === exerciseId);
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
    const session = await Session.findOne({
      userId: req.user.userId,
      completed: true,
      isActive: false,
    })
      .sort({ date: -1 })
      .populate('exercises.exercise')
      .populate('personalRecords.exercise');
    if (!session) return res.json(null);
    const sessionController = require('./sessionController');
    res.json(sessionController.sessionToJSON(session));
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

      const exerciseId = getExerciseIdFromLog(exerciseLog);
      if (!exerciseId) continue;

      const maxWeight = Math.max(...completedSets.map((s) => s.weightLbs));
      const totalVolume = completedSets.reduce((sum, s) => sum + s.weightLbs * s.reps, 0);

      const current = records[exerciseId];
      if (!current || maxWeight > current.maxWeight || totalVolume > current.maxVolume) {
        records[exerciseId] = {
          maxWeight: current ? Math.max(maxWeight, current.maxWeight) : maxWeight,
          maxVolume: current ? Math.max(totalVolume, current.maxVolume) : totalVolume,
          date: session.date,
        };
      }
    }
  }

  return records;
}
