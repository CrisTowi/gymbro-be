/**
 * One-time migration: drop the stale global routineId_1 unique index.
 *
 * The Routine schema used to have routineId as a globally unique field.
 * It was later changed to a per-user compound index { userId, routineId }.
 * The old index was never dropped from existing Atlas clusters, causing
 * E11000 errors when two different users have a routine with the same routineId.
 *
 * Usage:
 *   npm run migrate-routine-index
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Routine = require('../src/models/Routine');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const indexes = await Routine.collection.indexes();
  console.log('Current indexes on routines collection:');
  indexes.forEach((idx) => console.log(' ', JSON.stringify(idx.key), idx.unique ? '(unique)' : ''));

  const stale = indexes.find((idx) => idx.name === 'routineId_1');
  if (!stale) {
    console.log('\nroutineId_1 index not found — nothing to do.');
    process.exit(0);
  }

  await Routine.collection.dropIndex('routineId_1');
  console.log('\n✅  Dropped stale routineId_1 index.');
  console.log('    The compound { userId, routineId } index remains active.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
