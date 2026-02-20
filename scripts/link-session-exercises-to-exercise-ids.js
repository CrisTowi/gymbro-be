/**
 * Migration: link Session exercises and personalRecords to Exercise _id instead of exerciseId.
 *
 * Session documents store exercises[].exerciseId and personalRecords[].exerciseId as strings
 * (e.g. "bench-press"). This script resolves each to the corresponding Exercise document's _id
 * and updates the session so those fields reference _id (more reliable, no slug conflicts).
 *
 * Usage (from backend directory gymtrack-be):
 *   node scripts/link-session-exercises-to-exercise-ids.js
 *
 * Options:
 *   --dry-run   Log what would be updated without writing.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Exercise = require('../src/models/Exercise');
const Session = require('../src/models/Session');

function isObjectIdString(value) {
  if (value == null) return false;
  const str = typeof value === 'string' ? value : value.toString();
  return str.length === 24 && /^[a-f0-9]{24}$/i.test(str);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('(dry run – no changes will be written)\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const coll = mongoose.connection.collection('sessions');
  const sessions = await coll.find({}).toArray();
  console.log(`Found ${sessions.length} session(s).`);

  let updatedCount = 0;
  let skippedNoChange = 0;
  let exerciseIdWarnings = 0;

  // Build a map exerciseId -> _id once
  const exercises = await Exercise.find({}).lean();
  const exerciseIdToId = new Map(exercises.map((e) => [e.exerciseId, e._id.toString()]));

  for (const session of sessions) {
    const sessionId = session._id;
    const exercisesArray = session.exercises || [];
    const personalRecordsArray = session.personalRecords || [];

    const newExercises = [];
    let exercisesChanged = false;
    for (const entry of exercisesArray) {
      const value = entry.exerciseId ?? entry.exercise;
      if (value == null) {
        newExercises.push(entry);
        continue;
      }
      if (isObjectIdString(value)) {
        const { exerciseId: _e, ...rest } = entry;
        newExercises.push({ ...rest, exercise: new mongoose.Types.ObjectId(value) });
        exercisesChanged = exercisesChanged || entry.exerciseId !== undefined;
        continue;
      }
      const exerciseIdStr = String(value).trim();
      const refId = exerciseIdToId.get(exerciseIdStr);
      if (!refId) {
        console.warn(`  Session ${sessionId}: no exercise found for exerciseId="${exerciseIdStr}" – skipping entry`);
        exerciseIdWarnings++;
        newExercises.push(entry);
        continue;
      }
      const { exerciseId: _e2, ...rest } = entry;
      newExercises.push({ ...rest, exercise: new mongoose.Types.ObjectId(refId) });
      exercisesChanged = true;
    }

    const newPersonalRecords = [];
    let prChanged = false;
    for (const entry of personalRecordsArray) {
      const value = entry.exerciseId ?? entry.exercise;
      if (value == null) {
        newPersonalRecords.push(entry);
        continue;
      }
      if (isObjectIdString(value)) {
        const { exerciseId: _e, ...rest } = entry;
        newPersonalRecords.push({ ...rest, exercise: new mongoose.Types.ObjectId(value) });
        prChanged = prChanged || entry.exerciseId !== undefined;
        continue;
      }
      const exerciseIdStr = String(value).trim();
      const refId = exerciseIdToId.get(exerciseIdStr);
      if (!refId) {
        console.warn(`  Session ${sessionId} personalRecords: no exercise found for exerciseId="${exerciseIdStr}" – skipping entry`);
        exerciseIdWarnings++;
        newPersonalRecords.push(entry);
        continue;
      }
      const { exerciseId: _e2, ...rest } = entry;
      newPersonalRecords.push({ ...rest, exercise: new mongoose.Types.ObjectId(refId) });
      prChanged = true;
    }

    if (!exercisesChanged && !prChanged) {
      skippedNoChange++;
      continue;
    }

    const update = {};
    if (exercisesChanged) update.exercises = newExercises;
    if (prChanged) update.personalRecords = newPersonalRecords;

    if (!dryRun) {
      await coll.updateOne({ _id: sessionId }, { $set: update });
    }
    updatedCount++;
    console.log(`  ${dryRun ? 'Would update' : 'Updated'} session ${sessionId}`);
  }

  console.log('\nDone.');
  console.log(`  Updated: ${updatedCount}`);
  if (skippedNoChange) console.log(`  Skipped (no change): ${skippedNoChange}`);
  if (exerciseIdWarnings) console.log(`  Warnings (unknown exerciseId): ${exerciseIdWarnings}`);
  if (dryRun && updatedCount) console.log('\nRun without --dry-run to apply changes.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
