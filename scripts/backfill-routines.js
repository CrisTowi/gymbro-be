/**
 * Backfill existing (unclaimed) routines to a user (one-time migration).
 * Use after routines were made user-scoped; assigns all routines that have no
 * userId to your account. Skips any routineId you already have (e.g. from
 * seed-defaults) to avoid duplicate-key errors.
 *
 * Usage:
 *   node scripts/backfill-routines.js <email>
 *   node scripts/backfill-routines.js <userId>
 *
 * Examples:
 *   node scripts/backfill-routines.js you@example.com
 *   node scripts/backfill-routines.js 507f1f77bcf86cd799439011
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Routine = require('../src/models/Routine');
const User = require('../src/models/User');

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error('Usage: node scripts/backfill-routines.js <email|userId>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const isEmail = identifier.includes('@');
  const user = isEmail
    ? await User.findOne({ email: identifier.toLowerCase() })
    : await User.findById(identifier);

  if (!user) {
    console.error('User not found:', identifier);
    process.exit(1);
  }

  const userId = user._id;
  console.log('Backfilling routines for user:', user.email, `(${userId})`);

  // Routines with no userId (old seed data or pre-migration docs)
  const unclaimed = await Routine.find({
    $or: [{ userId: null }, { userId: { $exists: false } }],
  });
  console.log('Unclaimed routines found:', unclaimed.length);

  if (unclaimed.length === 0) {
    console.log('Nothing to backfill.');
    process.exit(0);
  }

  const existingRoutineIds = await Routine.find({ userId }).distinct('routineId');

  let updated = 0;
  let skipped = 0;

  for (const routine of unclaimed) {
    if (existingRoutineIds.includes(routine.routineId)) {
      console.log('  Skip', routine.routineId, '(you already have this routine)');
      skipped++;
      continue;
    }
    try {
      await Routine.updateOne(
        { _id: routine._id },
        { $set: { userId } }
      );
      console.log('  Assigned', routine.routineId, '-', routine.name);
      updated++;
      existingRoutineIds.push(routine.routineId);
    } catch (err) {
      console.error('  Failed to assign', routine.routineId, err.message);
    }
  }

  console.log('Routines assigned:', updated, '| Skipped:', skipped);
  console.log('Backfill completed.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
