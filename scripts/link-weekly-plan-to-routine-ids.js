/**
 * Migration: link WeeklyPlan day slots to Routine _id instead of routineId.
 *
 * Existing weekly plans store day values as routineId strings (e.g. "push", "pull").
 * This script resolves each routineId to the corresponding Routine document's _id
 * and updates the plan so day fields reference _id (more reliable, no slug conflicts).
 *
 * Prerequisites:
 *   - Plans that have userId: run as-is (we resolve by userId + routineId).
 *   - Plans with userId: null (unclaimed): skipped; run backfill-user-data.js first
 *     to assign them to a user, then run this script again.
 *
 * After running:
 *   - Update WeeklyPlan model so day fields are ObjectId refs (see model).
 *   - API/frontend should use routine _id for weekly plan (not routineId).
 *
 * Usage (from backend directory gymtrack-be):
 *   node scripts/link-weekly-plan-to-routine-ids.js
 *
 * Options:
 *   --dry-run   Log what would be updated without writing.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Routine = require('../src/models/Routine');
const WeeklyPlan = require('../src/models/WeeklyPlan');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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

  // Read from raw collection so we see existing string routineIds before schema change
  const coll = mongoose.connection.collection('weeklyplans');
  const plans = await coll.find({}).toArray();
  console.log(`Found ${plans.length} weekly plan(s).`);

  let updatedCount = 0;
  let skippedNoUser = 0;
  let skippedNoChange = 0;

  for (const plan of plans) {
    const planId = plan._id;
    if (!plan.userId) {
      console.log(`  Skip plan ${planId}: no userId (assign user first with backfill-user-data.js)`);
      skippedNoUser++;
      continue;
    }

    const updates = {};
    let hasChange = false;

    for (const day of DAYS) {
      const value = plan[day];
      if (value == null || value === '') continue;

      // Already stored as _id (e.g. from a previous run)
      if (isObjectIdString(value)) {
        continue;
      }

      // Treat as routineId: resolve to Routine _id
      const routineIdStr = String(value).trim();
      const routine = await Routine.findOne({
        userId: plan.userId,
        routineId: routineIdStr,
      });

      if (!routine) {
        console.warn(`  Plan ${planId} ${day}: no routine found for userId=${plan.userId} routineId="${routineIdStr}" – clearing slot`);
        updates[day] = null;
        hasChange = true;
        continue;
      }

      updates[day] = routine._id;
      hasChange = true;
    }

    if (!hasChange) {
      skippedNoChange++;
      continue;
    }

    if (!dryRun) {
      await WeeklyPlan.updateOne({ _id: planId }, { $set: updates });
    }
    updatedCount++;
    console.log(`  ${dryRun ? 'Would update' : 'Updated'} plan ${planId}: ${Object.keys(updates).join(', ')}`);
  }

  console.log('\nDone.');
  console.log(`  Updated: ${updatedCount}`);
  if (skippedNoUser) console.log(`  Skipped (no userId): ${skippedNoUser}`);
  if (skippedNoChange) console.log(`  Skipped (no change): ${skippedNoChange}`);
  if (dryRun && updatedCount) console.log('\nRun without --dry-run to apply changes.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
