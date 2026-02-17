/**
 * Backfill existing sessions and weekly plan to a user (one-time migration).
 * Use after you have registered; assigns all unclaimed sessions and the
 * unclaimed weekly plan to your account.
 *
 * Usage:
 *   node scripts/backfill-user-data.js <email>
 *   node scripts/backfill-user-data.js <userId>
 *
 * Examples:
 *   node scripts/backfill-user-data.js you@example.com
 *   node scripts/backfill-user-data.js 507f1f77bcf86cd799439011
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Session = require('../src/models/Session');
const WeeklyPlan = require('../src/models/WeeklyPlan');
const User = require('../src/models/User');

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error('Usage: node scripts/backfill-user-data.js <email|userId>');
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
  console.log('Backfilling data for user:', user.email, `(${userId})`);

  const sessionResult = await Session.updateMany(
    { userId: null },
    { $set: { userId } }
  );
  console.log('Sessions updated:', sessionResult.modifiedCount, 'of', sessionResult.matchedCount);

  const planResult = await WeeklyPlan.updateMany(
    { userId: null },
    { $set: { userId } }
  );
  console.log('Weekly plans updated:', planResult.modifiedCount, 'of', planResult.matchedCount);

  console.log('Backfill completed.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
