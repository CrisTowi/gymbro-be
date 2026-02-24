/**
 * Upsert exercises in the DB with i18n name, description, and instructions (en/es).
 * Reads the JSON file produced by the frontend translate-exercises script and
 * updates each exercise by exerciseId (same IDs so routines/sessions keep referencing them).
 *
 * Usage:
 *   node scripts/upsert-exercises-i18n.js <path-to-exercises-i18n.json>
 *
 * Examples:
 *   node scripts/upsert-exercises-i18n.js ../gymtrack/scripts/output/exercises-i18n.json
 *   EXERCISES_I18N_JSON=./data/exercises-i18n.json node scripts/upsert-exercises-i18n.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Exercise = require('../src/models/Exercise');

async function main() {
  const jsonPath = process.env.EXERCISES_I18N_JSON || process.argv[2];
  if (!jsonPath) {
    console.error('Usage: node scripts/upsert-exercises-i18n.js <path-to-exercises-i18n.json>');
    console.error('   or:  EXERCISES_I18N_JSON=<path> node scripts/upsert-exercises-i18n.js');
    process.exit(1);
  }

  const resolvedPath = path.isAbsolute(jsonPath) ? jsonPath : path.resolve(process.cwd(), jsonPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error('File not found:', resolvedPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('Invalid JSON:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('JSON must be an array of exercises.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  console.log('Upserting', data.length, 'exercises from', resolvedPath);

  let updated = 0;
  let inserted = 0;

  for (const item of data) {
    const exerciseId = item.id;
    if (!exerciseId) {
      console.warn('  Skip item missing id:', JSON.stringify(item).slice(0, 60) + '…');
      continue;
    }

    const update = {
      exerciseId,
      name: item.name,
      description: item.description,
      instructions: item.instructions,
      category: item.category,
      secondaryMuscles: item.secondaryMuscles || [],
      equipment: item.equipment,
      tags: item.tags || [],
      referenceUrl: item.referenceUrl,
    };

    const existing = await Exercise.findOne({ exerciseId });
    await Exercise.findOneAndUpdate(
      { exerciseId },
      { $set: update },
      { upsert: true, new: true }
    );
    if (existing) {
      updated++;
      console.log('  Updated', exerciseId);
    } else {
      inserted++;
      console.log('  Inserted', exerciseId);
    }
  }

  console.log('Done. Updated:', updated, '| Inserted:', inserted);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
